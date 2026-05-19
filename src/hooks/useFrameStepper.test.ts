import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useFrameStepper } from './useFrameStepper'

class TestVideo extends EventTarget {
  currentTime = 0
  duration = 1
  readyState = 1
  paused = false

  pause = vi.fn(() => {
    this.paused = true
  })
}

describe('useFrameStepper', () => {
  it('clamps seeking and pauses before updating currentTime', () => {
    const testVideo = new TestVideo()
    const video = testVideo as unknown as HTMLVideoElement
    const { result } = renderHook(() => useFrameStepper(video, 30, 1))

    void act(() => result.current.seekToFrame(999))

    expect(result.current.frameIndex).toBe(29)
    expect(testVideo.pause).toHaveBeenCalled()
    expect(testVideo.currentTime).toBeCloseTo(29.5 / 30)
  })

  it('preserves a pending seek until metadata is loaded', () => {
    const testVideo = new TestVideo()
    testVideo.readyState = 0
    testVideo.duration = Number.POSITIVE_INFINITY
    const video = testVideo as unknown as HTMLVideoElement
    const { result } = renderHook(() => useFrameStepper(video, 30, 1))

    void act(() => result.current.seekToFrame(10))
    expect(testVideo.currentTime).toBe(0)

    testVideo.readyState = 1
    testVideo.duration = 1
    void act(() => testVideo.dispatchEvent(new Event('loadedmetadata')))

    expect(testVideo.currentTime).toBeCloseTo(10.5 / 30)
  })
})
