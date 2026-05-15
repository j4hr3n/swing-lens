import { useCallback, useRef } from 'react'

interface ScrubBarProps {
  frameIndex: number
  totalFrames: number
  fps: number
  onSeekFrame: (frame: number) => void
}

export default function ScrubBar({ frameIndex, totalFrames, fps, onSeekFrame }: ScrubBarProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const max = Math.max(totalFrames - 1, 0)
  const safeFrame = Math.min(Math.max(frameIndex, 0), max)
  const progress = max > 0 ? safeFrame / max : 0

  const seekFromPointer = useCallback(
    (clientX: number) => {
      const el = trackRef.current
      if (!el || max <= 0) return
      const rect = el.getBoundingClientRect()
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      const frame = Math.round(ratio * max)
      onSeekFrame(frame)
    },
    [max, onSeekFrame],
  )

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    seekFromPointer(e.clientX)
  }
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return
    seekFromPointer(e.clientX)
  }

  // Pick a tick interval that gives ~10–20 ticks total
  const tickInterval = pickTickInterval(max, fps)
  const ticks: number[] = []
  if (tickInterval > 0) {
    for (let f = 0; f <= max; f += tickInterval) ticks.push(f)
  }

  const currentTime = safeFrame / Math.max(fps, 1)
  const totalTime = max / Math.max(fps, 1)
  const frameDigits = String(max).length

  return (
    <div className="px-4 pb-1 pt-2">
      <div className="mb-2 flex items-center justify-between gap-2 numeric text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
        <span>{formatTime(currentTime)}</span>
        <span>
          Frame <span className="text-[color:var(--color-text)]">{String(safeFrame).padStart(frameDigits, '0')}</span>
          <span className="opacity-50"> / {max}</span>
        </span>
        <span>{formatTime(totalTime)}</span>
      </div>
      <div
        ref={trackRef}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={safeFrame}
        aria-label="Scrub timeline"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') onSeekFrame(Math.max(0, safeFrame - 1))
          else if (e.key === 'ArrowRight') onSeekFrame(Math.min(max, safeFrame + 1))
        }}
        className="relative h-8 cursor-pointer touch-none select-none"
      >
        {/* Hit area is full height; visuals sit centered */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2">
          {/* Base track */}
          <div className="h-px bg-[color:var(--color-border)]" />

          {/* Ticks */}
          <div className="pointer-events-none absolute inset-0">
            {ticks.map((t, i) => {
              const left = max > 0 ? (t / max) * 100 : 0
              const isMajor = i % 5 === 0 || t === 0 || t === max
              return (
                <span
                  key={t}
                  aria-hidden="true"
                  className="absolute top-1/2 w-px -translate-x-1/2 -translate-y-1/2 bg-[color:var(--color-border)]"
                  style={{
                    left: `${left}%`,
                    height: isMajor ? '8px' : '4px',
                    opacity: isMajor ? 1 : 0.55,
                  }}
                />
              )
            })}
          </div>

          {/* Progress fill */}
          <div
            className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 bg-[color:var(--color-accent)]"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Playhead */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 -translate-x-1/2"
          style={{ left: `${progress * 100}%` }}
          aria-hidden="true"
        >
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[color:var(--color-accent)]" />
          <svg
            width="10"
            height="6"
            viewBox="0 0 10 6"
            className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 text-[color:var(--color-accent)]"
            fill="currentColor"
            aria-hidden="true"
          >
            <polygon points="5,0 10,6 0,6" />
          </svg>
        </div>
      </div>
    </div>
  )
}

function pickTickInterval(maxFrame: number, fps: number): number {
  if (maxFrame <= 0) return 0
  // Aim for 10–20 ticks total
  const targetCount = 14
  const raw = Math.max(1, Math.round(maxFrame / targetCount))
  // Snap to fps multiples when reasonable
  const candidates = [
    Math.round(fps / 4),
    Math.round(fps / 2),
    fps,
    fps * 2,
    fps * 5,
    fps * 10,
    fps * 30,
  ].filter((n) => n > 0)
  let best = raw
  let bestDiff = Infinity
  for (const c of candidates) {
    const d = Math.abs(c - raw)
    if (d < bestDiff) {
      bestDiff = d
      best = c
    }
  }
  return best
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '00:00.00'
  const total = Math.max(0, sec)
  const m = Math.floor(total / 60)
  const s = total - m * 60
  return `${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`
}
