interface BracketsProps {
  active?: boolean
  size?: number
  className?: string
}

export default function Brackets({ active = false, size = 14, className }: BracketsProps) {
  const stroke = active ? 'var(--color-accent)' : 'var(--color-border)'
  const w = size
  const corner = (
    <svg
      width={w}
      height={w}
      viewBox="0 0 14 14"
      fill="none"
      stroke={stroke}
      strokeWidth="1.25"
      aria-hidden="true"
    >
      <polyline points="0,5 0,0 5,0" />
    </svg>
  )
  return (
    <div className={'pointer-events-none absolute inset-0 ' + (className ?? '')}>
      <div className="absolute left-2 top-2">{corner}</div>
      <div className="absolute right-2 top-2 rotate-90">{corner}</div>
      <div className="absolute bottom-2 right-2 rotate-180">{corner}</div>
      <div className="absolute bottom-2 left-2 -rotate-90">{corner}</div>
    </div>
  )
}
