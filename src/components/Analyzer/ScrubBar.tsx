interface ScrubBarProps {
  frameIndex: number
  totalFrames: number
  fps: number
  onSeekFrame: (frame: number) => void
}

export default function ScrubBar({ frameIndex, totalFrames, fps, onSeekFrame }: ScrubBarProps) {
  const max = Math.max(totalFrames - 1, 0)
  return (
    <div className="px-4 py-2">
      <div className="mb-1 flex justify-between text-[11px] tabular-nums text-[color:var(--color-text-muted)]">
        <span>{formatTime(frameIndex / Math.max(fps, 1))}</span>
        <span>frame {frameIndex} / {max}</span>
        <span>{formatTime(max / Math.max(fps, 1))}</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={Math.min(frameIndex, max)}
        onChange={(e) => onSeekFrame(parseInt(e.target.value, 10))}
        className="w-full accent-[color:var(--color-accent)]"
      />
    </div>
  )
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0.00s'
  return sec.toFixed(2) + 's'
}
