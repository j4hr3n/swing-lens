import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, isToday, isYesterday } from 'date-fns'
import { useRecordings } from '../../hooks/useRecordings'
import { deleteRecording, renameRecording } from '../../lib/recordings'
import RecordingTile from './RecordingTile'
import ImportSheet from './ImportSheet'
import RecordingMenu from './RecordingMenu'
import RenameDialog from '../shared/RenameDialog'
import InstallHint from '../shared/InstallHint'
import Wordmark from '../shared/Wordmark'
import { IconPlus, IconSettings } from '../shared/Icons'
import type { Recording } from '../../types'

interface DateGroup {
  key: string
  label: string
  items: Recording[]
}

export default function LibraryPage() {
  const recordings = useRecordings()
  const [showImport, setShowImport] = useState(false)
  const [menuFor, setMenuFor] = useState<Recording | undefined>()
  const [renameFor, setRenameFor] = useState<Recording | undefined>()
  const [pendingDelete, setPendingDelete] = useState<Recording | undefined>()

  const groups = useMemo<DateGroup[]>(() => {
    if (!recordings) return []
    const map = new Map<string, DateGroup>()
    const thisYear = new Date().getFullYear()
    for (const r of recordings) {
      const d = new Date(r.createdAt)
      const key = format(d, 'yyyy-MM-dd')
      let g = map.get(key)
      if (!g) {
        let label: string
        if (isToday(d)) label = 'Today'
        else if (isYesterday(d)) label = 'Yesterday'
        else if (d.getFullYear() === thisYear) label = format(d, 'EEEE, MMM d')
        else label = format(d, 'MMM d, yyyy')
        g = { key, label, items: [] }
        map.set(key, g)
      }
      g.items.push(r)
    }
    return Array.from(map.values())
  }, [recordings])

  return (
    <div className="flex h-full flex-col bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
      <header
        className="flex items-center justify-between px-5 pb-4 pt-4 hairline-b"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <Wordmark />
        <Link
          to="/settings"
          aria-label="Settings"
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--color-text-muted)] transition-colors active:bg-[color:var(--color-bg-elevated)] active:text-[color:var(--color-text)]"
        >
          <IconSettings size={20} />
        </Link>
      </header>

      <InstallHint />

      <main className="flex-1 overflow-y-auto px-5 pb-32 pt-4">
        {recordings === undefined ? (
          <p className="mt-12 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)] sl-pulse">
            Loading source…
          </p>
        ) : recordings.length === 0 ? (
          <EmptyState onAdd={() => setShowImport(true)} />
        ) : (
          <div className="flex flex-col gap-6">
            {groups.map((g, gi) => (
              <section
                key={g.key}
                className="sl-rise"
                style={{ animationDelay: `${Math.min(gi * 80, 280)}ms` }}
              >
                <h2 className="mb-3 label-eyebrow text-[color:var(--color-text-muted)]">
                  {g.label}
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {g.items.map((r) => (
                    <RecordingTile key={r.id} recording={r} onMenu={setMenuFor} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <button
        type="button"
        aria-label="Add swing"
        onClick={() => setShowImport(true)}
        className="fixed right-5 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-accent)] text-[color:var(--color-bg)] glow-accent transition-transform active:scale-95"
        style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <IconPlus size={22} strokeWidth={2.25} />
      </button>

      <ImportSheet open={showImport} onClose={() => setShowImport(false)} />
      <RecordingMenu
        recording={menuFor}
        onClose={() => setMenuFor(undefined)}
        onRename={() => {
          setRenameFor(menuFor)
          setMenuFor(undefined)
        }}
        onDelete={() => {
          setPendingDelete(menuFor)
          setMenuFor(undefined)
        }}
      />
      <RenameDialog
        open={!!renameFor}
        initial={renameFor?.name ?? ''}
        onCancel={() => setRenameFor(undefined)}
        onSave={async (name) => {
          if (renameFor) await renameRecording(renameFor.id, name)
          setRenameFor(undefined)
        }}
      />
      <ConfirmDelete
        recording={pendingDelete}
        onCancel={() => setPendingDelete(undefined)}
        onConfirm={async () => {
          if (pendingDelete) await deleteRecording(pendingDelete.id)
          setPendingDelete(undefined)
        }}
      />
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mt-16 flex flex-col items-center text-center">
      <div className="relative px-10 py-8">
        <span className="numeric block text-[64px] font-light leading-none tracking-tight text-[color:var(--color-text-muted)]">
          00
        </span>
        <div className="pointer-events-none absolute inset-0">
          <Corner className="absolute left-0 top-0" />
          <Corner className="absolute right-0 top-0 rotate-90" />
          <Corner className="absolute bottom-0 right-0 rotate-180" />
          <Corner className="absolute bottom-0 left-0 -rotate-90" />
        </div>
      </div>
      <h2 className="mt-5 label-eyebrow text-[color:var(--color-text)]">No swings yet</h2>
      <p className="mt-3 max-w-[18rem] text-[13px] leading-relaxed text-[color:var(--color-text-muted)]">
        Import a slo-mo clip from your camera roll, or record one with the in-app lens.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-7 flex items-center gap-2 rounded-full bg-[color:var(--color-accent)] px-5 py-2.5 text-[13px] font-medium text-[color:var(--color-bg)] transition-transform active:scale-[0.97]"
      >
        <span>Add a swing</span>
        <span aria-hidden="true" className="text-[color:var(--color-bg)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="13,6 19,12 13,18" />
          </svg>
        </span>
      </button>
    </div>
  )
}

function Corner({ className = '' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="var(--color-border)"
      strokeWidth="1.25"
      aria-hidden="true"
      className={className}
    >
      <polyline points="0,5 0,0 5,0" />
    </svg>
  )
}

function ConfirmDelete({
  recording,
  onCancel,
  onConfirm,
}: {
  recording: Recording | undefined
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!recording) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="label-eyebrow text-[color:var(--color-text-muted)]">Confirm</p>
        <h2 className="mt-2 text-[15px] font-medium leading-snug">Delete "{recording.name}"?</h2>
        <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--color-text-muted)]">
          The clip and all annotations are removed from this device. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-[13px] text-[color:var(--color-text-muted)] active:text-[color:var(--color-text)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg border border-[color:var(--color-danger)] bg-[color:var(--color-danger)]/10 px-4 py-2 text-[13px] font-medium text-[color:var(--color-danger)] active:bg-[color:var(--color-danger)] active:text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
