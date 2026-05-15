interface PlaybackControlsProps {
  playing: boolean
  speed: number
  onTogglePlay: () => void
  onSpeedChange: (speed: number) => void
}

const SPEEDS = [0.25, 0.5, 1]

export default function PlaybackControls({
  playing,
  speed,
  onTogglePlay,
  onSpeedChange,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <div className="flex gap-1">
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
      <div className="w-[7.5rem]" />
    </div>
  )
}
