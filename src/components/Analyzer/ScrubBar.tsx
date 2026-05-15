import { useCallback, useEffect, useRef, useState } from 'react'

interface ScrubBarProps {
  frameIndex: number
  totalFrames: number
  fps: number
  onSeekFrame: (frame: number) => void
}

export default function ScrubBar({ frameIndex, totalFrames, fps, onSeekFrame }: ScrubBarProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const collapseTimer = useRef<number | undefined>(undefined)
  const [active, setActive] = useState(false)

  const max = Math.max(totalFrames - 1, 0)
  const safeFrame = Math.min(Math.max(frameIndex, 0), max)
  const progress = max > 0 ? safeFrame / max : 0

  const armCollapse = useCallback(() => {
    if (collapseTimer.current) window.clearTimeout(collapseTimer.current)
    collapseTimer.current = window.setTimeout(() => setActive(false), 1200)
  }, [])

  useEffect(() => () => {
    if (collapseTimer.current) window.clearTimeout(collapseTimer.current)
  }, [])

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
    if (collapseTimer.current) window.clearTimeout(collapseTimer.current)
    setActive(true)
    seekFromPointer(e.clientX)
  }
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return
    seekFromPointer(e.clientX)
  }
  const handlePointerUp = () => {
    armCollapse()
  }

  const tickInterval = pickTickInterval(max, fps)
  const ticks: number[] = []
  if (active && tickInterval > 0) {
    for (let f = 0; f <= max; f += tickInterval) ticks.push(f)
  }

  const currentTime = safeFrame / Math.max(fps, 1)

  return (
    <div className="px-3 pt-2 pb-1">
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
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') onSeekFrame(Math.max(0, safeFrame - 1))
          else if (e.key === 'ArrowRight') onSeekFrame(Math.min(max, safeFrame + 1))
        }}
        className="pointer-events-auto relative cursor-pointer touch-none select-none transition-[height] duration-200"
        style={{ height: active ? 28 : 14 }}
      >
        {/* Base track */}
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2 rounded-full bg-white/15 transition-[height] duration-200"
          style={{ height: active ? 4 : 2 }}
        />

        {/* Ticks (only when active) */}
        {active ? (
          <div className="pointer-events-none absolute inset-0">
            {ticks.map((t, i) => {
              const left = max > 0 ? (t / max) * 100 : 0
              const isMajor = i % 5 === 0 || t === 0 || t === max
              return (
                <span
                  key={t}
                  aria-hidden="true"
                  className="absolute top-1/2 w-px -translate-x-1/2 -translate-y-1/2 bg-white/35"
                  style={{
                    left: `${left}%`,
                    height: isMajor ? 10 : 5,
                    opacity: isMajor ? 1 : 0.65,
                  }}
                />
              )
            })}
          </div>
        ) : null}

        {/* Progress fill */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-[color:var(--color-accent)] transition-[height] duration-200"
          style={{ width: `${progress * 100}%`, height: active ? 4 : 2 }}
        />

        {/* Playhead */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 -translate-x-1/2"
          style={{ left: `${progress * 100}%` }}
          aria-hidden="true"
        >
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--color-accent)] transition-all duration-200"
            style={{
              width: active ? 4 : 8,
              height: active ? 18 : 8,
              boxShadow: '0 0 0 1.5px rgba(0,0,0,0.6)',
            }}
          />
        </div>

        {/* Floating pill (active only) */}
        {active ? (
          <div
            className="pointer-events-none absolute -translate-x-1/2"
            style={{
              left: `${progress * 100}%`,
              bottom: 'calc(100% + 4px)',
            }}
          >
            <div className="numeric whitespace-nowrap rounded-sm bg-black/70 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-[color:var(--color-text)]">
              {formatTime(currentTime)} <span className="opacity-50">·</span> {safeFrame}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function pickTickInterval(maxFrame: number, fps: number): number {
  if (maxFrame <= 0) return 0
  const targetCount = 14
  const raw = Math.max(1, Math.round(maxFrame / targetCount))
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
