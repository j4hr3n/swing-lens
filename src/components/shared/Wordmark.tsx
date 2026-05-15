interface WordmarkProps {
  kicker?: string
  size?: 'sm' | 'md'
}

export default function Wordmark({ kicker = 'Motion analysis', size = 'md' }: WordmarkProps) {
  const titleClass =
    size === 'md'
      ? 'text-[13px] font-light uppercase tracking-[0.22em] text-[color:var(--color-text)]'
      : 'text-[11px] font-light uppercase tracking-[0.22em] text-[color:var(--color-text)]'
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline gap-2">
        <span className={titleClass}>
          Swing<span className="mx-1 inline-block h-px w-2.5 translate-y-[-3px] bg-[color:var(--color-accent)] align-middle" />
          Lens
        </span>
      </div>
      <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
        {kicker}
      </span>
    </div>
  )
}
