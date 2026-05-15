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
import type { Annotation } from '../../types'

export default function AnalyzerPage() {
  const { id } = useParams()
  const recording = useRecording(id)
  const videoUrl = useObjectUrl(recording?.videoFileName)
  const videoRef = useRef<HTMLVideoElement>(null)
  const state = useVideoState(videoRef)
  const [speed, setSpeed] = useState(1)
  const [annotations, setAnnotations] = useState<Annotation[]>([])

  const fps = recording?.fps ?? 30
  const duration = state.duration || recording?.duration || 0
  const stepper = useFrameStepper(videoRef, fps, duration)

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed
  }, [speed, videoUrl])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) void v.play()
    else v.pause()
  }

  const commitAnnotation = (a: Annotation) => setAnnotations((prev) => [...prev, a])
  const undo = () => setAnnotations((prev) => prev.slice(0, -1))
  const clearAll = () => setAnnotations([])

  if (recording === undefined) {
    return (
      <CenteredMessage>
        <p className="text-sm text-[color:var(--color-text-muted)]">Loading…</p>
      </CenteredMessage>
    )
  }

  if (!recording) {
    return (
      <CenteredMessage>
        <p className="text-sm">Recording not found.</p>
        <Link to="/" className="mt-4 text-sm text-[color:var(--color-accent)] underline">Back to library</Link>
      </CenteredMessage>
    )
  }

  return (
    <div className="flex h-full flex-col bg-[color:var(--color-bg)]">
      <header
        className="flex items-center justify-between gap-2 px-2 pb-1 pt-2"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        <Link
          to="/"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-[color:var(--color-text-muted)] active:bg-[color:var(--color-bg-elevated)]"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="15,6 9,12 15,18" />
          </svg>
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-center text-sm font-medium text-[color:var(--color-text)]">{recording.name}</h1>
        <div className="h-10 w-10" />
      </header>

      <div className="flex flex-1 items-center justify-center overflow-hidden bg-black">
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
          </div>
        ) : (
          <p className="text-sm text-[color:var(--color-text-muted)]">Loading video…</p>
        )}
      </div>

      <div className="pb-[max(0.25rem,env(safe-area-inset-bottom))]">
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
