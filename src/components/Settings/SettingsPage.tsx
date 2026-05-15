import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../../lib/db'
import { clearAll as clearAllOpfs } from '../../lib/opfs'

interface StorageInfo {
  used: number
  quota: number
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export default function SettingsPage() {
  const [info, setInfo] = useState<StorageInfo | undefined>()
  const [count, setCount] = useState<number | undefined>()
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [clearing, setClearing] = useState(false)

  const refresh = async () => {
    if ('storage' in navigator && navigator.storage.estimate) {
      const est = await navigator.storage.estimate()
      setInfo({ used: est.usage ?? 0, quota: est.quota ?? 0 })
    }
    setCount(await db.recordings.count())
  }

  useEffect(() => {
    void refresh()
  }, [])

  const doClear = async () => {
    setClearing(true)
    try {
      await db.recordings.clear()
      await clearAllOpfs()
      setConfirmingClear(false)
      await refresh()
    } finally {
      setClearing(false)
    }
  }

  const percent = info && info.quota > 0 ? Math.min(100, (info.used / info.quota) * 100) : 0

  return (
    <div className="flex h-full flex-col bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
      <header
        className="flex items-center gap-2 px-2 pb-2 pt-2"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        <Link
          to="/"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-[color:var(--color-text-muted)] active:bg-[color:var(--color-bg-elevated)]"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="15,6 9,12 15,18" />
          </svg>
        </Link>
        <h1 className="flex-1 text-sm font-medium">Settings</h1>
        <div className="h-10 w-10" />
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-2">
        <section className="rounded-xl bg-[color:var(--color-bg-elevated)] p-4">
          <h2 className="text-xs uppercase tracking-wide text-[color:var(--color-text-muted)]">Storage</h2>
          <div className="mt-2 flex items-baseline justify-between text-sm">
            <span>{info ? formatBytes(info.used) : '—'}</span>
            <span className="text-[color:var(--color-text-muted)]">
              of {info ? formatBytes(info.quota) : '—'}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color:var(--color-bg-input)]">
            <div
              className="h-full bg-[color:var(--color-accent)]"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-[color:var(--color-text-muted)]">
            {count ?? 0} recording{count === 1 ? '' : 's'} on device.
          </p>
        </section>

        <section className="mt-4 rounded-xl bg-[color:var(--color-bg-elevated)] p-4">
          <h2 className="text-xs uppercase tracking-wide text-[color:var(--color-text-muted)]">Data</h2>
          <button
            type="button"
            onClick={() => setConfirmingClear(true)}
            disabled={!count}
            className="mt-3 w-full rounded-lg bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 active:opacity-80 disabled:opacity-30"
          >
            Clear all data
          </button>
        </section>

        <p className="mt-6 text-center text-[11px] text-[color:var(--color-text-muted)]">
          Swing Lens · personal local-only PWA
        </p>
      </main>

      {confirmingClear ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={() => !clearing && setConfirmingClear(false)}>
          <div
            className="w-full max-w-sm rounded-2xl bg-[color:var(--color-bg-elevated)] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-medium">Clear all recordings?</h2>
            <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
              All videos and annotations on this device will be permanently deleted.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmingClear(false)}
                disabled={clearing}
                className="rounded-lg px-4 py-2 text-sm text-[color:var(--color-text-muted)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={doClear}
                disabled={clearing}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {clearing ? 'Clearing…' : 'Clear all'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
