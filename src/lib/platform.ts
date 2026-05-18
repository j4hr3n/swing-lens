export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/.test(ua)) return true
  // iPadOS 13+ reports as Mac; distinguish via touch support.
  return ua.includes('Mac') && navigator.maxTouchPoints > 1
}
