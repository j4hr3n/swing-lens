import { useEffect, useState } from 'react'

const STORAGE_KEY = 'swing-lens:install-hint-dismissed'

function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (!isIOS) return false
  const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua)
  return isSafari
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
    <div
      className="mx-3 mt-2 flex items-start gap-2 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-3 text-xs text-[color:var(--color-text-muted)]"
    >
      <span aria-hidden="true">📲</span>
      <div className="flex-1 leading-snug">
        Install Swing Lens — tap{' '}
        <ShareIcon /> in Safari, then{' '}
        <span className="font-medium text-[color:var(--color-text)]">Add to Home Screen</span>.
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          localStorage.setItem(STORAGE_KEY, '1')
          setShow(false)
        }}
        className="text-[color:var(--color-text-muted)] active:opacity-60"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="6" y1="18" x2="18" y2="6" />
        </svg>
      </button>
    </div>
  )
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block align-text-bottom" aria-hidden="true">
      <path d="M12 4v12" />
      <polyline points="8,8 12,4 16,8" />
      <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5" />
    </svg>
  )
}
