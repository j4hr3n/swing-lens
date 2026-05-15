interface ScrubBarProps {
  currentTime: number
  duration: number
  fps: number
  onSeek: (time: number) => void
}

export default function ScrubBar({ currentTime, duration, fps, onSeek }: ScrubBarProps) {
  const safeDuration = Math.max(duration, 0.001)
  const frameIndex = Math.round(currentTime * fps)
  const totalFrames = Math.round(duration * fps)
  return (
    <div className="px-4 py-2">
      <div className="mb-1 flex justify-between text-[11px] tabular-nums text-[color:var(--color-text-muted)]">
        <span>{formatTime(currentTime)}</span>
        <span>frame {frameIndex} / {totalFrames}</span>
        <span>{formatTime(duration)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={safeDuration}
        step={1 / Math.max(fps, 1)}
        value={Math.min(currentTime, safeDuration)}
        onChange={(e) => onSeek(parseFloat(e.target.value))}
        className="w-full accent-[color:var(--color-accent)]"
      />
    </div>
  )
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0.00'
  return sec.toFixed(2) + 's'
}
