import type { ReactNode } from 'react'
import { IconArrowRight } from './Icons'

interface ChoiceButtonProps {
  disabled?: boolean
  icon?: ReactNode
  label: string
  hint?: string
  danger?: boolean
  onClick: () => void
}

export default function ChoiceButton({
  disabled,
  icon,
  label,
  hint,
  danger = false,
  onClick,
}: ChoiceButtonProps) {
  const colorClass = danger
    ? 'text-[color:var(--color-danger)]'
    : 'text-[color:var(--color-text)]'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group flex w-full items-center gap-3 border border-[color:var(--color-border)] bg-transparent px-4 py-3.5 text-left transition-colors active:bg-[color:var(--color-bg-input)] disabled:opacity-50"
    >
      {icon ? (
        <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center border border-[color:var(--color-border)] ${colorClass}`}>
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className={`block text-[14px] font-medium ${colorClass}`}>{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-[11px] leading-relaxed text-[color:var(--color-text-muted)]">
            {hint}
          </span>
        ) : null}
      </span>
      <span className="flex-shrink-0 text-[color:var(--color-text-muted)] transition-transform group-active:translate-x-0.5">
        <IconArrowRight size={16} />
      </span>
    </button>
  )
}
