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

export default function PlaybackControls({
  playing,
  speed,
  onTogglePlay,
  onSpeedChange,
  onStepBack,
  onStepForward,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="flex flex-1 items-center gap-0.5">
        <span className="label-eyebrow-sm pr-1 text-[color:var(--color-text-muted)]" aria-hidden="true">
          Spd
        </span>
        {SPEEDS.map((s) => {
          const active = s === speed
          return (
            <button
              key={s}
              type="button"
              onClick={() => onSpeedChange(s)}
              className={
                'relative numeric px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] transition-colors ' +
                (active
                  ? 'text-[color:var(--color-text)]'
                  : 'text-[color:var(--color-text-muted)] active:text-[color:var(--color-text)]')
              }
            >
              {s === 1 ? '1×' : `${s}×`}
              <span
                aria-hidden="true"
                className={
                  'pointer-events-none absolute bottom-0 left-1/2 h-[2px] w-4 -translate-x-1/2 transition-colors ' +
                  (active ? 'bg-[color:var(--color-accent)]' : 'bg-transparent')
                }
              />
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous frame"
          onClick={onStepBack}
          className="flex h-11 w-11 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] text-[color:var(--color-text)] transition-transform active:scale-95"
        >
          <IconStepBack size={18} />
        </button>
        <button
          type="button"
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={onTogglePlay}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--color-accent)] bg-[color:var(--color-bg-elevated)] text-[color:var(--color-accent)] transition-transform active:scale-95"
          style={{ boxShadow: '0 0 0 1px var(--color-accent-dim), 0 8px 24px -8px rgba(216,255,58,0.35)' }}
        >
          {playing ? <IconPause size={22} /> : <IconPlay size={22} />}
        </button>
        <button
          type="button"
          aria-label="Next frame"
          onClick={onStepForward}
          className="flex h-11 w-11 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] text-[color:var(--color-text)] transition-transform active:scale-95"
        >
          <IconStepForward size={18} />
        </button>
      </div>

      <div className="flex-1" />
    </div>
  )
}
