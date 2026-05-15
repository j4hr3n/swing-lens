import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sheet from '../shared/Sheet'
import { importRecording } from '../../lib/recordings'

interface ImportSheetProps {
  open: boolean
  onClose: () => void
}

export default function ImportSheet({ open, onClose }: ImportSheetProps) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const handleFile = async (file: File) => {
    setBusy(true)
    setError(undefined)
    try {
      const recording = await importRecording(file)
      onClose()
      navigate(`/analyzer/${recording.id}`)
    } catch (e) {
      console.error(e)
      setError((e as Error).message || 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={busy ? () => {} : onClose} title="Add a swing">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-xl bg-[color:var(--color-bg-input)] p-4 text-left active:opacity-80 disabled:opacity-50"
        >
          <span aria-hidden="true" className="text-xl">📂</span>
          <span>
            <span className="block text-sm font-medium">Import from camera roll</span>
            <span className="block text-xs text-[color:var(--color-text-muted)]">
              Best for 240fps slo-mo — record with iPhone Camera, import here
            </span>
          </span>
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            onClose()
            navigate('/capture')
          }}
          className="flex w-full items-center gap-3 rounded-xl bg-[color:var(--color-bg-input)] p-4 text-left active:opacity-80 disabled:opacity-50"
        >
          <span aria-hidden="true" className="text-xl">🎥</span>
          <span>
            <span className="block text-sm font-medium">Record now</span>
            <span className="block text-xs text-[color:var(--color-text-muted)]">
              In-app capture (30–60fps depending on device)
            </span>
          </span>
        </button>
      </div>
      {busy ? (
        <p className="mt-3 text-center text-xs text-[color:var(--color-text-muted)]">Importing…</p>
      ) : null}
      {error ? <p className="mt-3 text-center text-xs text-red-400">{error}</p> : null}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void handleFile(file)
        }}
      />
    </Sheet>
  )
}
