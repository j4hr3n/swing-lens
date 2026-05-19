import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useRecording } from '../../hooks/useRecordings'
import { useObjectUrl } from '../../hooks/useObjectUrl'
import { useVideoState } from '../../hooks/useVideoState'
import { useFrameStepper } from '../../hooks/useFrameStepper'
import ScrubBar from './ScrubBar'
import PlaybackControls from './PlaybackControls'
import ToolPalette from './ToolPalette'
import AnnotationOverlay from './AnnotationOverlay'
import { IconBack, IconTrash, IconUndo } from '../shared/Icons'
import {
  attachThumbnail,
  clearRecordingAnnotations,
  getPendingFile,
  recordingStatus,
  updateRecordingAnnotations,
} from '../../lib/recordings'
import { captureFrameThumbnail } from '../../lib/videoMeta'
import type { Annotation, Recording } from '../../types'

export default function AnalyzerPage() {
  const { id } = useParams()
  const recording = useRecording(id)
  const pendingFile = id ? getPendingFile(id) : undefined
  const videoUrl = useObjectUrl(recording?.videoFileName, pendingFile)
  const thumbnailUrl = useObjectUrl(recording?.thumbnailFileName)
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const state = useVideoState(video)
  const [speed, setSpeed] = useState(1)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [annotationError, setAnnotationError] = useState<string | undefined>()
  const hydratedFor = useRef<string | undefined>(undefined)
  const thumbnailCapturedFor = useRef<string | undefined>(undefined)

  const fps = recording?.fps ?? 30
  const duration = state.duration || recording?.duration || 0
  const stepper = useFrameStepper(video, fps, duration)

  useEffect(() => {
    if (video) video.playbackRate = speed
  }, [speed, video])

  useEffect(() => {
    if (recording && hydratedFor.current !== recording.id) {
      hydratedFor.current = recording.id
      setAnnotations(recording.annotations ?? [])
      setAnnotationError(undefined)
    }
  }, [recording])

  // Force iOS to decode the first frame: call load() on src change, then
  // seek to 0 once metadata is loaded. Safari often only paints after an
  // explicit seek, otherwise the element stays black until play.
  useEffect(() => {
    const v = video
    if (!v || !videoUrl) return
    try {
      v.load()
    } catch {
      // ignore
    }
    const onLoaded = () => {
      try {
        v.currentTime = 0
      } catch {
        // ignore
      }
    }
    v.addEventListener('loadedmetadata', onLoaded)
    return () => v.removeEventListener('loadedmetadata', onLoaded)
  }, [video, videoUrl])

  // Capture the first decoded frame as the recording's thumbnail. Only runs
  // when the recording is missing a thumbnail (typical for a fresh import).
  useEffect(() => {
    const v = video
    if (!v || !recording) return
    if (recording.thumbnailFileName) return
    if (thumbnailCapturedFor.current === recording.id) return

    type RVFCMeta = { mediaTime: number }
    type RVFCVideo = HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: (now: number, meta: RVFCMeta) => void) => number
      cancelVideoFrameCallback?: (handle: number) => void
    }
    const rv = v as RVFCVideo
    let cancelled = false
    let handle: number | undefined

    const capture = async () => {
      if (cancelled) return
      try {
        const blob = await captureFrameThumbnail(v)
        if (cancelled) return
        thumbnailCapturedFor.current = recording.id
        await attachThumbnail(recording.id, blob)
      } catch (e) {
        console.warn('Thumbnail capture failed', e)
      }
    }

    if (typeof rv.requestVideoFrameCallback === 'function') {
      handle = rv.requestVideoFrameCallback(() => {
        void capture()
      })
    } else {
      const onSeeked = () => {
        v.removeEventListener('seeked', onSeeked)
        void capture()
      }
      v.addEventListener('seeked', onSeeked)
      return () => {
        cancelled = true
        v.removeEventListener('seeked', onSeeked)
      }
    }

    return () => {
      cancelled = true
      if (handle !== undefined && typeof rv.cancelVideoFrameCallback === 'function') {
        rv.cancelVideoFrameCallback(handle)
      }
    }
  }, [video, recording, videoUrl])

  const persist = useCallback((next: Annotation[], write?: Promise<void>) => {
    const previous = annotations
    setAnnotations(next)
    setAnnotationError(undefined)
    if (recording) {
      ;(write ?? updateRecordingAnnotations(recording.id, next)).catch((err: unknown) => {
        console.error('Annotation save failed', err)
        setAnnotations(previous)
        setAnnotationError('Could not save annotations.')
      })
    }
  }, [annotations, recording])

  const togglePlay = useCallback(() => {
    if (!video) return
    if (video.paused) {
      video.play().catch((err: unknown) => {
        console.warn('Video play failed', err)
      })
    }
    else video.pause()
  }, [video])

  const commitAnnotation = useCallback((a: Annotation) => persist([...annotations, a]), [annotations, persist])
  const updateAnnotation = useCallback((annotationId: string, partial: Partial<Annotation>) => {
    persist(
      annotations.map((a) => (a.id === annotationId ? { ...a, ...partial } : a)),
    )
  }, [annotations, persist])
  const undo = useCallback(() => persist(annotations.slice(0, -1)), [annotations, persist])
  const clearAll = useCallback(() => {
    if (!recording) return
    persist([], clearRecordingAnnotations(recording.id))
  }, [persist, recording])

  const setVideoElement = useCallback((node: HTMLVideoElement | null) => {
    setVideo(node)
  }, [])

  const stepBack = useCallback(() => stepper.step(-1), [stepper])
  const stepForward = useCallback(() => stepper.step(1), [stepper])

  if (recording === undefined) {
    return (
      <CenteredMessage>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)] sl-pulse">
          Loading source · –:–
        </p>
      </CenteredMessage>
    )
  }

  if (!recording) {
    return (
      <CenteredMessage>
        <p className="label-eyebrow text-[color:var(--color-text)]">Recording not found</p>
        <Link to="/" className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
          Back to library
        </Link>
      </CenteredMessage>
    )
  }

  const total = stepper.totalFrames
  const currentFrame = stepper.frameIndex
  const paddedFrame = String(currentFrame).padStart(String(Math.max(total - 1, 0)).length, '0')
  const hasAnnotations = annotations.length > 0
  const scrubReady = state.ready && total > 0
  const status = recordingStatus(recording)

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <VideoStage
        recording={recording}
        videoUrl={videoUrl}
        thumbnailUrl={thumbnailUrl}
        annotations={annotations}
        onVideo={setVideoElement}
        onCommit={commitAnnotation}
        onUpdate={updateAnnotation}
      />

      <AnalyzerHud
        recording={recording}
        paddedFrame={paddedFrame}
        total={total}
        hasAnnotations={hasAnnotations}
        status={status}
        onUndo={undo}
        onClearAll={clearAll}
      />

      {status === 'failed' ? (
        <div className="pointer-events-auto absolute inset-x-0 top-16 z-20 mx-auto max-w-sm px-4">
          <div className="border border-[color:var(--color-danger)] bg-black/80 px-3 py-2 text-[12px] text-[color:var(--color-danger)]">
            Saving this clip failed. Re-import from the library to retry.
          </div>
        </div>
      ) : null}

      {annotationError ? (
        <div className="pointer-events-auto absolute inset-x-3 bottom-28 z-20 text-center">
          <span className="inline-block border border-[color:var(--color-danger)] bg-black/80 px-3 py-2 text-[12px] text-[color:var(--color-danger)]">
            {annotationError}
          </span>
        </div>
      ) : null}

      <AnalyzerControls
        frameIndex={stepper.frameIndex}
        totalFrames={stepper.totalFrames}
        fps={fps}
        playing={state.playing}
        speed={speed}
        scrubReady={scrubReady}
        onSeekFrame={stepper.seekToFrame}
        onTogglePlay={togglePlay}
        onSpeedChange={setSpeed}
        onStepBack={stepBack}
        onStepForward={stepForward}
      />
    </div>
  )
}

const VideoStage = memo(function VideoStage({
  recording,
  videoUrl,
  thumbnailUrl,
  annotations,
  onVideo,
  onCommit,
  onUpdate,
}: {
  recording: Recording
  videoUrl: string | undefined
  thumbnailUrl: string | undefined
  annotations: Annotation[]
  onVideo: (node: HTMLVideoElement | null) => void
  onCommit: (annotation: Annotation) => void
  onUpdate: (id: string, partial: Partial<Annotation>) => void
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {videoUrl ? (
        <div
          className="relative"
          style={{
            aspectRatio: `${recording.width} / ${recording.height}`,
            maxWidth: '100%',
            maxHeight: '100%',
            width: '100%',
          }}
        >
          <video
            ref={onVideo}
            src={videoUrl}
            poster={thumbnailUrl}
            playsInline
            muted
            preload="auto"
            className="absolute inset-0 h-full w-full"
          />
          <AnnotationOverlay
            annotations={annotations}
            onCommit={onCommit}
            onUpdate={onUpdate}
          />
        </div>
      ) : (
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)] sl-pulse">
          Loading source · –:–
        </p>
      )}
    </div>
  )
})

const AnalyzerHud = memo(function AnalyzerHud({
  recording,
  paddedFrame,
  total,
  hasAnnotations,
  status,
  onUndo,
  onClearAll,
}: {
  recording: Recording
  paddedFrame: string
  total: number
  hasAnnotations: boolean
  status: 'ready' | 'pending' | 'failed'
  onUndo: () => void
  onClearAll: () => void
}) {
  return (
    <div className="video-ink pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/90 via-black/55 to-transparent">
      <div
        className="flex items-center gap-2 px-2 pb-6"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        <Link
          to="/"
          aria-label="Back"
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full text-white video-ink-icon active:bg-white/10"
        >
          <IconBack size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-semibold leading-tight text-white">
            {recording.name}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 numeric whitespace-nowrap text-[11px] uppercase tracking-[0.14em] text-white/85">
            <span>
              Frame {paddedFrame}
              <span className="text-white/55"> / {Math.max(total - 1, 0)}</span>
            </span>
            <span className="h-2.5 w-px bg-white/40" />
            <span>{recording.fps ? `${recording.fps} fps` : '— fps'}</span>
            {status === 'pending' ? (
              <>
                <span className="h-2.5 w-px bg-white/40" />
                <span className="sl-pulse">Saving…</span>
              </>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          aria-label="Undo"
          disabled={!hasAnnotations}
          onClick={onUndo}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-md text-white video-ink-icon active:bg-white/10 disabled:opacity-30"
        >
          <IconUndo size={18} />
        </button>
        <button
          type="button"
          aria-label="Clear all"
          disabled={!hasAnnotations}
          onClick={onClearAll}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-md text-white video-ink-icon active:bg-white/10 active:text-[color:var(--color-danger)] disabled:opacity-30"
        >
          <IconTrash size={18} />
        </button>
      </div>
    </div>
  )
})

const AnalyzerControls = memo(function AnalyzerControls({
  frameIndex,
  totalFrames,
  fps,
  playing,
  speed,
  scrubReady,
  onSeekFrame,
  onTogglePlay,
  onSpeedChange,
  onStepBack,
  onStepForward,
}: {
  frameIndex: number
  totalFrames: number
  fps: number
  playing: boolean
  speed: number
  scrubReady: boolean
  onSeekFrame: (frame: number) => void
  onTogglePlay: () => void
  onSpeedChange: (speed: number) => void
  onStepBack: () => void
  onStepForward: () => void
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/55 to-transparent">
      <div
        className="pt-6"
        style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}
      >
        <ScrubBar
          frameIndex={frameIndex}
          totalFrames={totalFrames}
          fps={fps}
          onSeekFrame={onSeekFrame}
          disabled={!scrubReady}
        />
        <div className="pointer-events-auto flex items-center justify-between gap-2 px-3 py-1.5">
          <ToolPalette />
          <PlaybackControls
            playing={playing}
            speed={speed}
            onTogglePlay={onTogglePlay}
            onSpeedChange={onSpeedChange}
            onStepBack={onStepBack}
            onStepForward={onStepForward}
          />
        </div>
      </div>
    </div>
  )
})

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      {children}
    </div>
  )
}
