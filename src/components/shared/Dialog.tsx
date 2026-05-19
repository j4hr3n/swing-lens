import { type ReactNode, useEffect, useRef } from 'react'

interface DialogProps {
  open: boolean
  kicker?: string
  title: string
  children: ReactNode
  onClose: () => void
}

export default function Dialog({ open, kicker, title, children, onClose }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null

    const focusTimer = window.setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      focusable?.focus()
    }, 0)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKey)
      previousFocusRef.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="w-full max-w-sm rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {kicker ? (
          <p className="label-eyebrow text-[color:var(--color-text-muted)]">{kicker}</p>
        ) : null}
        <h2 id="dialog-title" className="mt-2 text-[15px] font-medium leading-snug">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
