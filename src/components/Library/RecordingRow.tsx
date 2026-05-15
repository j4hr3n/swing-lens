import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import type { Recording } from '../../types'
import { useObjectUrl } from '../../hooks/useObjectUrl'
import { IconDotsVertical, IconPlay } from '../shared/Icons'

interface RecordingRowProps {
  recording: Recording
  onMenu: (recording: Recording) => void
}

export default function RecordingRow({ recording, onMenu }: RecordingRowProps) {
  const navigate = useNavigate()
  const thumbUrl = useObjectUrl(recording.thumbnailFileName)
  const date = format(new Date(recording.createdAt), 'd MMM').toUpperCase()
  const dur = formatDuration(recording.duration)

  return (
    <div className="group relative flex w-full items-stretch gap-3 py-3 hairline-b">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-2 left-0 w-px bg-[color:var(--color-accent)] opacity-0 transition-opacity duration-150 group-active:opacity-100"
      />
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        onClick={() => navigate(`/analyzer/${recording.id}`)}
      >
        <div className="relative aspect-video h-[68px] flex-shrink-0 overflow-hidden border border-[color:var(--color-border)] bg-[color:var(--color-bg-input)]">
          {thumbUrl ? (
            <img src={thumbUrl} alt="" className="h-full w-full object-cover" draggable={false} />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                no preview
              </span>
            </div>
          )}
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-active:opacity-100">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-[color:var(--color-accent)] backdrop-blur-sm">
              <IconPlay size={12} />
            </span>
          </span>
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <div className="truncate text-[14px] font-medium leading-snug text-[color:var(--color-text)]">
            {recording.name}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 numeric text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
            <span>{date}</span>
            <Sep />
            <span>{recording.fps}fps</span>
            <Sep />
            <span>{dur}</span>
          </div>
        </div>
      </button>
      <button
        type="button"
        aria-label="More actions"
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center self-center rounded-full text-[color:var(--color-text-muted)] active:bg-[color:var(--color-bg-elevated)] active:text-[color:var(--color-text)]"
        onClick={() => onMenu(recording)}
      >
        <IconDotsVertical size={18} />
      </button>
    </div>
  )
}

function Sep() {
  return <span className="h-3 w-px bg-[color:var(--color-border)]" aria-hidden="true" />
}

function formatDuration(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '—'
  if (sec < 60) {
    return `00:${sec.toFixed(2).padStart(5, '0')}`
  }
  const m = Math.floor(sec / 60)
  const s = sec - m * 60
  return `${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`
}
