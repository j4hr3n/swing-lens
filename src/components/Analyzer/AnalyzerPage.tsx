import { useEffect, useRef, useState } from 'react'
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
import { db } from '../../lib/db'
import { attachThumbnail, getPendingFile } from '../../lib/recordings'
import { captureFrameThumbnail } from '../../lib/videoMeta'
import type { Annotation } from '../../types'

export default function AnalyzerPage() {
  const { id } = useParams()
  const recording = useRecording(id)
  const pendingFile = id ? getPendingFile(id) : undefined
  const videoUrl = useObjectUrl(recording?.videoFileName, pendingFile)
  const thumbnailUrl = useObjectUrl(recording?.thumbnailFileName)
  const videoRef = useRef<HTMLVideoElement>(null)
  const state = useVideoState(videoRef)
  const [speed, setSpeed] = useState(1)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const hydratedFor = useRef<string | undefined>(undefined)
  const thumbnailCapturedFor = useRef<string | undefined>(undefined)

  const fps = recording?.fps ?? 30
  const duration = state.duration || recording?.duration || 0
  const stepper = useFrameStepper(videoRef, fps, duration)

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed
  }, [speed, videoUrl])

  useEffect(() => {
    if (recording && hydratedFor.current !== recording.id) {
      hydratedFor.current = recording.id
      setAnnotations(recording.annotations ?? [])
    }
  }, [recording])

  // Force iOS to decode the first frame: call load() on src change, then
  // seek to 0 once metadata is loaded. Safari often only paints after an
  // explicit seek, otherwise the element stays black until play.
  useEffect(() => {
    const v = videoRef.current
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
  }, [videoUrl])

  // Capture the first decoded frame as the recording's thumbnail. Only runs
  // when the recording is missing a thumbnail (typical for a fresh import).
  useEffect(() => {
    const v = videoRef.current
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
      handle = rv.requestVideoFrameCallback!(() => {
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
  }, [recording, videoUrl])

  const persist = (next: Annotation[]) => {
    setAnnotations(next)
    if (recording) {
      void db.recordings.update(recording.id, { annotations: next })
    }
  }

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) void v.play()
    else v.pause()
  }

  const commitAnnotation = (a: Annotation) => persist([...annotations, a])
  const updateAnnotation = (annotationId: string, partial: Partial<Annotation>) => {
    persist(
      annotations.map((a) => (a.id === annotationId ? ({ ...a, ...partial } as Annotation) : a)),
    )
  }
  const undo = () => persist(annotations.slice(0, -1))
  const clearAll = () => persist([])

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

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
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
              ref={videoRef}
              src={videoUrl}
              poster={thumbnailUrl}
              playsInline
              muted
              preload="auto"
              className="absolute inset-0 h-full w-full"
            />
            <AnnotationOverlay
              annotations={annotations}
              onCommit={commitAnnotation}
              onUpdate={updateAnnotation}
            />
          </div>
        ) : (
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)] sl-pulse">
            Loading source · –:–
          </p>
        )}
      </div>

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
              {recording.pending ? (
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
            onClick={undo}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-md text-white video-ink-icon active:bg-white/10 disabled:opacity-30"
          >
            <IconUndo size={18} />
          </button>
          <button
            type="button"
            aria-label="Clear all"
            disabled={!hasAnnotations}
            onClick={clearAll}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-md text-white video-ink-icon active:bg-white/10 active:text-[color:var(--color-danger)] disabled:opacity-30"
          >
            <IconTrash size={18} />
          </button>
        </div>
      </div>

      {recording.failed ? (
        <div className="pointer-events-auto absolute inset-x-0 top-16 z-20 mx-auto max-w-sm px-4">
          <div className="border border-[color:var(--color-danger)] bg-black/80 px-3 py-2 text-[12px] text-[color:var(--color-danger)]">
            Saving this clip failed. Re-import from the library to retry.
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/55 to-transparent">
        <div
          className="pt-6"
          style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}
        >
          <ScrubBar
            frameIndex={stepper.frameIndex}
            totalFrames={stepper.totalFrames}
            fps={fps}
            onSeekFrame={stepper.seekToFrame}
            disabled={!scrubReady}
          />
          <div className="pointer-events-auto flex items-center justify-between gap-2 px-3 py-1.5">
            <ToolPalette />
            <PlaybackControls
              playing={state.playing}
              speed={speed}
              onTogglePlay={togglePlay}
              onSpeedChange={setSpeed}
              onStepBack={() => stepper.step(-1)}
              onStepForward={() => stepper.step(1)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      {children}
    </div>
  )
}
