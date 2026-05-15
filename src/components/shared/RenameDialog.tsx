import { useEffect, useRef, useState } from 'react'

interface RenameDialogProps {
  open: boolean
  initial: string
  onCancel: () => void
  onSave: (name: string) => void
}

export default function RenameDialog({ open, initial, onCancel, onSave }: RenameDialogProps) {
  const [value, setValue] = useState(initial)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setValue(initial)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, initial])

  if (!open) return null

  const trimmed = value.trim()
  const canSave = trimmed.length > 0 && trimmed !== initial

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[color:var(--color-bg-elevated)] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-base font-medium">Rename</h2>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canSave) onSave(trimmed)
            if (e.key === 'Escape') onCancel()
          }}
          className="w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-input)] px-3 py-2 text-base text-[color:var(--color-text)] outline-none focus:border-[color:var(--color-accent)]"
        />
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
            disabled={!canSave}
            onClick={() => onSave(trimmed)}
            className="rounded-lg bg-[color:var(--color-accent)] px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
