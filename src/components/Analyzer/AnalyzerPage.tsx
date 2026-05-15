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
import Brackets from '../shared/Brackets'
import { IconBack } from '../shared/Icons'
import { db } from '../../lib/db'
import type { Annotation } from '../../types'

export default function AnalyzerPage() {
  const { id } = useParams()
  const recording = useRecording(id)
  const videoUrl = useObjectUrl(recording?.videoFileName)
  const videoRef = useRef<HTMLVideoElement>(null)
  const state = useVideoState(videoRef)
  const [speed, setSpeed] = useState(1)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const hydratedFor = useRef<string | undefined>(undefined)

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

  return (
    <div className="flex h-full flex-col bg-[color:var(--color-bg)]">
      <header
        className="flex items-center gap-3 px-3 pb-3 pt-2 hairline-b"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        <Link
          to="/"
          aria-label="Back"
          className="flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--color-text-muted)] active:bg-[color:var(--color-bg-elevated)] active:text-[color:var(--color-text)]"
        >
          <IconBack size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[14px] font-medium leading-tight text-[color:var(--color-text)]">
            {recording.name}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 numeric text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
            <span>Frame {paddedFrame}<span className="opacity-50"> / {Math.max(total - 1, 0)}</span></span>
            <span className="h-2.5 w-px bg-[color:var(--color-border)]" />
            <span>{fps} fps</span>
          </p>
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]"
          aria-hidden="true"
        >
          SL
        </div>
      </header>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
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
              playsInline
              muted
              preload="auto"
              className="absolute inset-0 h-full w-full"
            />
            <AnnotationOverlay annotations={annotations} onCommit={commitAnnotation} />
            <Brackets active={annotations.length > 0} />
          </div>
        ) : (
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)] sl-pulse">
            Loading source · –:–
          </p>
        )}
      </div>

      <div className="pb-[max(0.25rem,env(safe-area-inset-bottom))] hairline-t">
        <ToolPalette
          onUndo={undo}
          onClear={clearAll}
          canUndo={annotations.length > 0}
          canClear={annotations.length > 0}
        />
        <ScrubBar
          frameIndex={stepper.frameIndex}
          totalFrames={stepper.totalFrames}
          fps={fps}
          onSeekFrame={stepper.seekToFrame}
        />
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
  )
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      {children}
    </div>
  )
}
