import type { Pt } from '../types'

export function distance(a: Pt, b: Pt): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  return Math.sqrt(dx * dx + dy * dy)
}

export function uid(): string {
  return crypto.randomUUID()
}

export function clamp01(v: number): number {
  if (v < 0) return 0
  if (v > 1) return 1
  return v
}
