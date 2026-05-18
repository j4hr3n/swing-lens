interface WordmarkProps {
  size?: 'sm' | 'md'
}

export default function Wordmark({ size = 'md' }: WordmarkProps) {
  const cls =
    size === 'md'
      ? 'text-[17px] leading-none tracking-[-0.015em]'
      : 'text-[14px] leading-none tracking-[-0.01em]'
  return (
    <span className={cls + ' text-[color:var(--color-text)]'}>
      <span className="font-semibold">Swing</span>
      <span className="font-light text-[color:var(--color-text-muted)]">Lens</span>
    </span>
  )
}
