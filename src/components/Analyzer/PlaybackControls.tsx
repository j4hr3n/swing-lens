interface PlaybackControlsProps {
  playing: boolean
  speed: number
  onTogglePlay: () => void
  onSpeedChange: (speed: number) => void
  onStepBack: () => void
  onStepForward: () => void
}

const SPEEDS = [0.25, 0.5, 1]

export default function PlaybackControls({
  playing,
  speed,
  onTogglePlay,
  onSpeedChange,
  onStepBack,
  onStepForward,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3">
      <div className="flex flex-1 gap-1">
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSpeedChange(s)}
            className={
              'rounded-full px-3 py-1 text-xs font-medium tabular-nums ' +
              (s === speed
                ? 'bg-[color:var(--color-accent)] text-black'
                : 'bg-[color:var(--color-bg-elevated)] text-[color:var(--color-text-muted)]')
            }
          >
            {s === 1 ? '1×' : `${s}×`}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous frame"
          onClick={onStepBack}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-bg-elevated)] text-[color:var(--color-text)] active:scale-95"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <polygon points="18,5 9,12 18,19" />
            <rect x="5" y="5" width="2" height="14" />
          </svg>
        </button>
        <button
          type="button"
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={onTogglePlay}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-accent)] text-black active:scale-95"
        >
          {playing ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" />
              <rect x="14" y="5" width="4" height="14" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="6,4 20,12 6,20" />
            </svg>
          )}
        </button>
        <button
          type="button"
          aria-label="Next frame"
          onClick={onStepForward}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-bg-elevated)] text-[color:var(--color-text)] active:scale-95"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <polygon points="6,5 15,12 6,19" />
            <rect x="17" y="5" width="2" height="14" />
          </svg>
        </button>
      </div>

      <div className="flex-1" />
    </div>
  )
}
