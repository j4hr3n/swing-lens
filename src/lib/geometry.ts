import type { Pt } from '../types'

export function distance(a: Pt, b: Pt): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  return Math.sqrt(dx * dx + dy * dy)
}

export function angleDegrees(vertex: Pt, a: Pt, b: Pt): number {
  const va = Math.atan2(a[1] - vertex[1], a[0] - vertex[0])
  const vb = Math.atan2(b[1] - vertex[1], b[0] - vertex[0])
  let deg = ((vb - va) * 180) / Math.PI
  deg = Math.abs(deg)
  if (deg > 180) deg = 360 - deg
  return deg
}

export function uid(): string {
  return crypto.randomUUID()
}

export function clamp01(v: number): number {
  if (v < 0) return 0
  if (v > 1) return 1
  return v
}

export function normalize(v: Pt): Pt {
  const len = Math.hypot(v[0], v[1])
  if (len === 0) return [0, 0]
  return [v[0] / len, v[1] / len]
}
