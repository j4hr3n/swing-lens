import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import type { Recording } from '../../types'
import { useObjectUrl } from '../../hooks/useObjectUrl'

interface RecordingRowProps {
  recording: Recording
  onMenu: (recording: Recording) => void
}

export default function RecordingRow({ recording, onMenu }: RecordingRowProps) {
  const navigate = useNavigate()
  const thumbUrl = useObjectUrl(recording.thumbnailFileName)

  return (
    <div className="flex w-full items-center gap-2 rounded-xl bg-[color:var(--color-bg-elevated)]">
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 rounded-l-xl p-2 text-left active:bg-[color:var(--color-bg-input)]"
        onClick={() => navigate(`/analyzer/${recording.id}`)}
      >
        <div className="aspect-video h-16 flex-shrink-0 overflow-hidden rounded-lg bg-[color:var(--color-bg-input)]">
          {thumbUrl ? (
            <img src={thumbUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{recording.name}</div>
          <div className="mt-0.5 text-xs text-[color:var(--color-text-muted)]">
            {format(new Date(recording.createdAt), 'MMM d, HH:mm')} · {recording.fps}fps · {formatDuration(recording.duration)}
          </div>
        </div>
      </button>
      <button
        type="button"
        aria-label="More actions"
        className="mr-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[color:var(--color-text-muted)] active:bg-[color:var(--color-bg-input)]"
        onClick={() => onMenu(recording)}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <circle cx="4" cy="10" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="16" cy="10" r="1.5" />
        </svg>
      </button>
    </div>
  )
}

function formatDuration(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '—'
  if (sec < 60) return `${sec.toFixed(1)}s`
  const m = Math.floor(sec / 60)
  const s = Math.round(sec - m * 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
