import { IconPause, IconPlay, IconStepBack, IconStepForward } from '../shared/Icons'

interface PlaybackControlsProps {
  playing: boolean
  speed: number
  onTogglePlay: () => void
  onSpeedChange: (speed: number) => void
  onStepBack: () => void
  onStepForward: () => void
}

const SPEEDS = [0.25, 0.5, 1]

function nextSpeed(current: number): number {
  const i = SPEEDS.indexOf(current)
  return SPEEDS[(i + 1) % SPEEDS.length] ?? 1
}

export default function PlaybackControls({
  playing,
  speed,
  onTogglePlay,
  onSpeedChange,
  onStepBack,
  onStepForward,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Previous frame"
        onClick={onStepBack}
        className="flex h-9 w-9 items-center justify-center rounded-md text-white video-ink-icon active:bg-white/10"
      >
        <IconStepBack size={16} />
      </button>
      <button
        type="button"
        aria-label={playing ? 'Pause' : 'Play'}
        onClick={onTogglePlay}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--color-accent)] text-black transition-transform active:scale-95"
        style={{ boxShadow: '0 6px 18px -6px rgba(216,255,58,0.45)' }}
      >
        {playing ? <IconPause size={20} /> : <IconPlay size={20} />}
      </button>
      <button
        type="button"
        aria-label="Next frame"
        onClick={onStepForward}
        className="flex h-9 w-9 items-center justify-center rounded-md text-white video-ink-icon active:bg-white/10"
      >
        <IconStepForward size={16} />
      </button>
      <button
        type="button"
        aria-label={`Speed ${speed}x — tap to cycle`}
        onClick={() => onSpeedChange(nextSpeed(speed))}
        className="numeric flex h-9 min-w-[36px] items-center justify-center rounded-md bg-black/40 px-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white active:bg-white/15"
      >
        {speed === 1 ? '1×' : `${speed}×`}
      </button>
    </div>
  )
}
