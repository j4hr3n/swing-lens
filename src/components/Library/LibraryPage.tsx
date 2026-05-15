import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRecordings } from '../../hooks/useRecordings'
import { deleteRecording, renameRecording } from '../../lib/recordings'
import RecordingRow from './RecordingRow'
import ImportSheet from './ImportSheet'
import RecordingMenu from './RecordingMenu'
import RenameDialog from '../shared/RenameDialog'
import type { Recording } from '../../types'

export default function LibraryPage() {
  const recordings = useRecordings()
  const [showImport, setShowImport] = useState(false)
  const [menuFor, setMenuFor] = useState<Recording | undefined>()
  const [renameFor, setRenameFor] = useState<Recording | undefined>()
  const [pendingDelete, setPendingDelete] = useState<Recording | undefined>()

  return (
    <div className="flex h-full flex-col bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
      <header
        className="flex items-center justify-between px-4 pb-2 pt-4"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <h1 className="text-lg font-semibold">Swing Lens</h1>
        <Link
          to="/settings"
          aria-label="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-full text-[color:var(--color-text-muted)] active:bg-[color:var(--color-bg-elevated)]"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-32">
        {recordings === undefined ? (
          <p className="mt-12 text-center text-sm text-[color:var(--color-text-muted)]">Loading…</p>
        ) : recordings.length === 0 ? (
          <EmptyState onAdd={() => setShowImport(true)} />
        ) : (
          <ul className="flex flex-col gap-2">
            {recordings.map((r) => (
              <li key={r.id}>
                <RecordingRow recording={r} onMenu={setMenuFor} />
              </li>
            ))}
          </ul>
        )}
      </main>

      <button
        type="button"
        aria-label="Add swing"
        onClick={() => setShowImport(true)}
        className="fixed right-5 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-accent)] text-black shadow-xl active:scale-95"
        style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
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
    <div className="mt-20 flex flex-col items-center text-center">
      <div className="text-5xl">⛳️</div>
      <h2 className="mt-4 text-base font-medium">No swings yet</h2>
      <p className="mt-1 max-w-xs text-sm text-[color:var(--color-text-muted)]">
        Import a slo-mo video from your camera roll, or record a new swing.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-6 rounded-full bg-[color:var(--color-accent)] px-5 py-2.5 text-sm font-medium text-black"
      >
        Add a swing
      </button>
    </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-2xl bg-[color:var(--color-bg-elevated)] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-medium">Delete "{recording.name}"?</h2>
        <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">This can't be undone.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm text-[color:var(--color-text-muted)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
