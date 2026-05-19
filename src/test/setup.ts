import '@testing-library/jest-dom/vitest'

if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:test-url'
}

if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = () => {}
}

if (!('IntersectionObserver' in globalThis)) {
  class TestIntersectionObserver implements IntersectionObserver {
    readonly root = null
    readonly rootMargin = ''
    readonly scrollMargin = ''
    readonly thresholds = []
    private readonly callback: IntersectionObserverCallback

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback
    }

    disconnect(): void {}
    observe(target: Element): void {
      this.callback(
        [{ isIntersecting: true, target } as IntersectionObserverEntry],
        this,
      )
    }
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
    unobserve(): void {}
  }

  globalThis.IntersectionObserver = TestIntersectionObserver
}
