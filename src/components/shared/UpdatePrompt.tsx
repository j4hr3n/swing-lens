import { useRegisterSW } from 'virtual:pwa-register/react'
import { IconClose } from './Icons'

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed inset-x-0 top-0 z-50 px-5 pt-3">
      <div className="mx-auto flex max-w-md items-start gap-3 border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-3.5 py-3 sl-slide-down">
        <div className="flex-1 leading-snug">
          <p className="label-eyebrow-sm text-[color:var(--color-accent)]">Update available</p>
          <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--color-text-muted)]">
            A new version of Swing Lens is ready.
          </p>
        </div>
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="flex-shrink-0 border border-[color:var(--color-accent)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--color-accent)] active:bg-[color:var(--color-accent)] active:text-[color:var(--color-bg)]"
        >
          Refresh
        </button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setNeedRefresh(false)}
          className="-mr-1 -mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center text-[color:var(--color-text-muted)] active:text-[color:var(--color-text)]"
        >
          <IconClose size={14} />
        </button>
      </div>
    </div>
  )
}
