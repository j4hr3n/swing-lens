import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

type RVFCMetadata = { mediaTime: number; presentedFrames: number }
type RVFCVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: (now: number, meta: RVFCMetadata) => void) => number
  cancelVideoFrameCallback?: (handle: number) => void
}

export interface FrameStepperApi {
  frameIndex: number
  totalFrames: number
  step: (direction: 1 | -1) => void
  seekToFrame: (frameIndex: number) => void
}

export function useFrameStepper(
  ref: RefObject<HTMLVideoElement | null>,
  fps: number,
  duration: number,
): FrameStepperApi {
  const [frameIndex, setFrameIndex] = useState(0)
  const totalFrames = Math.max(0, Math.round(duration * fps))
  const lastMediaTime = useRef(0)

  useEffect(() => {
    const video = ref.current as RVFCVideo | null
    if (!video) return

    const onSeeked = () => setFrameIndex(Math.round(video.currentTime * fps))
    video.addEventListener('seeked', onSeeked)

    const supportsRVFC = typeof video.requestVideoFrameCallback === 'function'
    if (!supportsRVFC) {
      const onTimeUpdate = () => setFrameIndex(Math.round(video.currentTime * fps))
      video.addEventListener('timeupdate', onTimeUpdate)
      return () => {
        video.removeEventListener('timeupdate', onTimeUpdate)
        video.removeEventListener('seeked', onSeeked)
      }
    }

    let active = true
    let handle: number | undefined

    const onFrame = (_now: number, meta: RVFCMetadata) => {
      if (!active) return
      lastMediaTime.current = meta.mediaTime
      setFrameIndex(Math.round(meta.mediaTime * fps))
      handle = video.requestVideoFrameCallback!(onFrame)
    }

    handle = video.requestVideoFrameCallback!(onFrame)

    return () => {
      active = false
      if (handle !== undefined && typeof video.cancelVideoFrameCallback === 'function') {
        video.cancelVideoFrameCallback(handle)
      }
      video.removeEventListener('seeked', onSeeked)
    }
  }, [ref, fps])

  const seekToFrame = useCallback(
    (target: number) => {
      const video = ref.current
      if (!video) return
      const clamped = Math.max(0, Math.min(totalFrames - 1, target))
      setFrameIndex(clamped)
      const targetTime = (clamped + 0.5) / fps
      video.pause()
      video.currentTime = targetTime
    },
    [ref, fps, totalFrames],
  )

  const step = useCallback(
    (direction: 1 | -1) => {
      seekToFrame(frameIndex + direction)
    },
    [frameIndex, seekToFrame],
  )

  return { frameIndex, totalFrames, step, seekToFrame }
}
