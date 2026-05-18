import { useEffect, useState } from 'react'
import { isIOS } from '../../lib/platform'
import { IconClose, IconShare } from './Icons'

const STORAGE_KEY = 'swing-lens:install-hint-dismissed'

function isIOSSafari(): boolean {
  if (!isIOS()) return false
  const ua = navigator.userAgent
  return /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua)
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const standaloneNav = (navigator as Navigator & { standalone?: boolean }).standalone
  if (standaloneNav) return true
  return window.matchMedia?.('(display-mode: standalone)').matches ?? false
}

export default function InstallHint() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isIOSSafari()) return
    if (isStandalone()) return
    if (localStorage.getItem(STORAGE_KEY)) return
    setShow(true)
  }, [])

  if (!show) return null

  return (
    <div className="mx-5 mt-3 flex items-start gap-3 border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-3.5 py-3 sl-slide-down">
      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center text-[color:var(--color-accent)]">
        <IconShare size={16} />
      </span>
      <div className="flex-1 leading-snug">
        <p className="label-eyebrow-sm text-[color:var(--color-accent)]">Install</p>
        <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--color-text-muted)]">
          Tap <ShareInline /> in Safari, then{' '}
          <span className="font-medium text-[color:var(--color-text)]">Add to Home Screen</span> for a full-screen lens.
        </p>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          localStorage.setItem(STORAGE_KEY, '1')
          setShow(false)
        }}
        className="-mr-1 -mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center text-[color:var(--color-text-muted)] active:text-[color:var(--color-text)]"
      >
        <IconClose size={14} />
      </button>
    </div>
  )
}

function ShareInline() {
  return (
    <span className="mx-0.5 inline-flex h-3.5 w-3.5 translate-y-[2px] items-center justify-center text-[color:var(--color-text)]">
      <IconShare size={12} />
    </span>
  )
}
