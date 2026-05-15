import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useRecording } from '../../hooks/useRecordings'
import { useObjectUrl } from '../../hooks/useObjectUrl'
import { useVideoState } from '../../hooks/useVideoState'
import ScrubBar from './ScrubBar'
import PlaybackControls from './PlaybackControls'

export default function AnalyzerPage() {
  const { id } = useParams()
  const recording = useRecording(id)
  const videoUrl = useObjectUrl(recording?.videoFileName)
  const videoRef = useRef<HTMLVideoElement>(null)
  const state = useVideoState(videoRef)
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed
  }, [speed, videoUrl])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) void v.play()
    else v.pause()
  }

  const seek = (time: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = time
  }

  if (recording === undefined) {
    return (
      <CenteredMessage>
        <p className="text-sm text-[color:var(--color-text-muted)]">Loading…</p>
      </CenteredMessage>
    )
  }

  if (recording === null || !recording) {
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
        className="flex items-center justify-between gap-2 px-2 pb-2 pt-2"
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

      <div className="flex flex-1 items-center justify-center bg-black">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            playsInline
            muted
            preload="auto"
            className="max-h-full max-w-full"
          />
        ) : (
          <p className="text-sm text-[color:var(--color-text-muted)]">Loading video…</p>
        )}
      </div>

      <div className="pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <ScrubBar
          currentTime={state.currentTime}
          duration={state.duration || recording.duration}
          fps={recording.fps}
          onSeek={seek}
        />
        <PlaybackControls
          playing={state.playing}
          speed={speed}
          onTogglePlay={togglePlay}
          onSpeedChange={setSpeed}
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
