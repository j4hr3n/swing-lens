import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const defaults = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function Base({ size = 20, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults} {...rest}>
      {children}
    </svg>
  )
}

export function IconPlus(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </Base>
  )
}

export function IconSettings(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.5a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.73v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </Base>
  )
}

export function IconBack(props: IconProps) {
  return (
    <Base {...props}>
      <polyline points="15,6 9,12 15,18" />
    </Base>
  )
}

export function IconClose(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </Base>
  )
}

export function IconDotsVertical(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="6" r="0.75" fill="currentColor" />
      <circle cx="12" cy="12" r="0.75" fill="currentColor" />
      <circle cx="12" cy="18" r="0.75" fill="currentColor" />
    </Base>
  )
}

export function IconUndo(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 14l-5-5 5-5" />
      <path d="M4 9h12a4 4 0 0 1 4 4v0a4 4 0 0 1 -4 4h-7" />
    </Base>
  )
}

export function IconTrash(props: IconProps) {
  return (
    <Base {...props}>
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6l-1 14a2 2 0 0 1 -2 2H8a2 2 0 0 1 -2 -2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </Base>
  )
}

export function IconPlay({ size = 20, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <polygon points="7,4 20,12 7,20" />
    </svg>
  )
}

export function IconPause({ size = 20, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <rect x="6" y="5" width="3.5" height="14" rx="0.5" />
      <rect x="14.5" y="5" width="3.5" height="14" rx="0.5" />
    </svg>
  )
}

export function IconStepBack({ size = 20, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <polygon points="18,5 9,12 18,19" />
      <rect x="5" y="5" width="2" height="14" rx="0.5" />
    </svg>
  )
}

export function IconStepForward({ size = 20, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <polygon points="6,5 15,12 6,19" />
      <rect x="17" y="5" width="2" height="14" rx="0.5" />
    </svg>
  )
}

export function IconFile(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <polyline points="14,3 14,8 19,8" />
    </Base>
  )
}

export function IconCamera(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </Base>
  )
}

export function IconShare(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 4v12" />
      <polyline points="8,8 12,4 16,8" />
      <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5" />
    </Base>
  )
}

export function IconArrowRight(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="13,6 19,12 13,18" />
    </Base>
  )
}
