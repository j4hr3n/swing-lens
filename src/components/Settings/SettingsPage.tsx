import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../../lib/db'
import { clearAll as clearAllOpfs } from '../../lib/opfs'
import { IconBack } from '../shared/Icons'

interface StorageInfo {
  used: number
  quota: number
}

function formatBytes(b: number): { value: string; unit: string } {
  if (b < 1024) return { value: String(b), unit: 'B' }
  if (b < 1024 * 1024) return { value: (b / 1024).toFixed(1), unit: 'KB' }
  if (b < 1024 * 1024 * 1024) return { value: (b / (1024 * 1024)).toFixed(1), unit: 'MB' }
  return { value: (b / (1024 * 1024 * 1024)).toFixed(2), unit: 'GB' }
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
  const used = info ? formatBytes(info.used) : undefined
  const quota = info ? formatBytes(info.quota) : undefined
  const countPadded = count !== undefined ? String(count).padStart(2, '0') : '—'

  return (
    <div className="flex h-full flex-col bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
      <header
        className="flex items-center gap-3 px-3 pb-3 pt-2 hairline-b"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        <Link
          to="/"
          aria-label="Back"
          className="flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--color-text-muted)] active:bg-[color:var(--color-bg-elevated)] active:text-[color:var(--color-text)]"
        >
          <IconBack size={20} />
        </Link>
        <h1 className="flex-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
          Swing Lens <span className="mx-1 opacity-50">·</span>{' '}
          <span className="text-[color:var(--color-text)]">Settings</span>
        </h1>
        <div className="h-11 w-11" />
      </header>

      <main className="flex-1 overflow-y-auto px-5 pt-5">
        <Section eyebrow="Library">
          <div className="flex items-baseline gap-3">
            <span className="numeric text-[40px] font-medium leading-none text-[color:var(--color-text)]">
              {countPadded}
            </span>
            <span className="label-eyebrow text-[color:var(--color-text-muted)]">
              {count === 1 ? 'Swing' : 'Swings'} on device
            </span>
          </div>
        </Section>

        <Section eyebrow="Storage">
          <div className="flex items-baseline justify-between">
            <span className="numeric text-[15px] font-medium text-[color:var(--color-text)]">
              {used ? (
                <>
                  {used.value}
                  <span className="ml-1 text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
                    {used.unit}
                  </span>
                </>
              ) : (
                '—'
              )}
            </span>
            <span className="numeric text-[11px] uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
              of {quota ? `${quota.value} ${quota.unit}` : '—'}
            </span>
          </div>
          <div className="mt-3 h-[2px] bg-[color:var(--color-bg-input)]">
            <div
              className="h-[2px] bg-[color:var(--color-accent)]"
              style={{ width: `${Math.max(percent, percent > 0 ? 1 : 0)}%`, transition: 'width 200ms ease' }}
            />
          </div>
        </Section>

        <Section eyebrow="Data">
          <button
            type="button"
            onClick={() => setConfirmingClear(true)}
            disabled={!count}
            className="w-full rounded-md border border-[color:var(--color-danger)]/30 bg-transparent px-4 py-3 text-[13px] font-medium text-[color:var(--color-danger)] transition-colors active:bg-[color:var(--color-danger)]/10 disabled:cursor-not-allowed disabled:border-[color:var(--color-border)] disabled:text-[color:var(--color-text-muted)] disabled:opacity-50"
          >
            Clear all data
          </button>
          <p className="mt-3 text-[11px] leading-relaxed text-[color:var(--color-text-muted)]">
            All clips and annotations live only on this device. Nothing is sent to any server.
          </p>
        </Section>

        <footer className="mt-10 flex items-center justify-center gap-2 pb-10">
          <p className="label-eyebrow-sm text-[color:var(--color-text-muted)]">
            Swing Lens <span className="mx-1 opacity-50">·</span> Local only
          </p>
          <span className="h-3 w-px bg-[color:var(--color-border)]" aria-hidden="true" />
          <p className="numeric text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)] opacity-60">
            v0.1
          </p>
        </footer>
      </main>

      {confirmingClear ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => !clearing && setConfirmingClear(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="label-eyebrow text-[color:var(--color-text-muted)]">Confirm</p>
            <h2 className="mt-2 text-[15px] font-medium leading-snug">Clear all recordings?</h2>
            <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--color-text-muted)]">
              Every clip and annotation is removed from this device. This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmingClear(false)}
                disabled={clearing}
                className="rounded-lg px-4 py-2 text-[13px] text-[color:var(--color-text-muted)] active:text-[color:var(--color-text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={doClear}
                disabled={clearing}
                className="rounded-lg border border-[color:var(--color-danger)] bg-[color:var(--color-danger)]/10 px-4 py-2 text-[13px] font-medium text-[color:var(--color-danger)] active:bg-[color:var(--color-danger)] active:text-white disabled:opacity-50"
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

function Section({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-[color:var(--color-border)] py-5">
      <h2 className="label-eyebrow mb-3 text-[color:var(--color-text-muted)]">{eyebrow}</h2>
      {children}
    </section>
  )
}
