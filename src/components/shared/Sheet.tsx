import { type ReactNode, useEffect } from 'react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  kicker?: string
  children: ReactNode
}

export default function Sheet({ open, onClose, title, kicker, children }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-b-0 border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-5 pb-8 shadow-2xl sl-rise"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[color:var(--color-border)]" />
        {kicker ? (
          <p className="label-eyebrow-sm mb-1.5 text-center text-[color:var(--color-text-muted)]">
            {kicker}
          </p>
        ) : null}
        {title ? (
          <h2 className="mb-4 truncate text-center text-[14px] font-medium text-[color:var(--color-text)]">
            {title}
          </h2>
        ) : null}
        {children}
      </div>
    </div>
  )
}
