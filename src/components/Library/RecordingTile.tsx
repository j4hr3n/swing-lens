import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Recording } from '../../types'
import { IconDotsVertical, IconPlay } from '../shared/Icons'

interface RecordingTileProps {
  recording: Recording
  thumbnailUrl: string | undefined
  onVisible: (id: string) => void
  onMenu: (recording: Recording) => void
}

export default function RecordingTile({
  recording,
  thumbnailUrl,
  onVisible,
  onMenu,
}: RecordingTileProps) {
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = rootRef.current
    if (!node) return
    if (!('IntersectionObserver' in window)) {
      onVisible(recording.id)
      return
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        onVisible(recording.id)
        observer.disconnect()
      }
    }, { rootMargin: '160px' })

    observer.observe(node)
    return () => observer.disconnect()
  }, [onVisible, recording.id])

  return (
    <div ref={rootRef} className="group relative">
      <button
        type="button"
        onClick={() => navigate(`/analyzer/${recording.id}`)}
        className="block aspect-[3/4] w-full overflow-hidden border border-[color:var(--color-border)] bg-[color:var(--color-bg-input)]"
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
              no preview
            </span>
          </div>
        )}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-active:opacity-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-[color:var(--color-accent)] backdrop-blur-sm">
            <IconPlay size={13} />
          </span>
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[color:var(--color-accent)] opacity-0 transition-opacity duration-150 group-active:opacity-100"
        />
      </button>
      <button
        type="button"
        aria-label="More actions"
        onClick={(e) => {
          e.stopPropagation()
          onMenu(recording)
        }}
        className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center bg-black/55 text-white backdrop-blur-sm active:bg-black/75"
      >
        <IconDotsVertical size={14} />
      </button>
    </div>
  )
}
