import { useCallback, useEffect, useRef, useState } from 'react'

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
  video: HTMLVideoElement | null,
  fps: number,
  duration: number,
): FrameStepperApi {
  const [frameIndex, setFrameIndex] = useState(0)
  const totalFrames = Math.max(0, Math.round((isFinite(duration) ? duration : 0) * fps))
  const lastMediaTime = useRef(0)
  const pendingTarget = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!video) return
    const rvfcVideo = video as RVFCVideo

    const onSeeked = () => setFrameIndex(Math.round(video.currentTime * fps))
    const onLoadedMetadata = () => {
      if (pendingTarget.current !== undefined) {
        const target = pendingTarget.current
        pendingTarget.current = undefined
        try {
          video.currentTime = target
        } catch {
          // ignore — duration may still be unsettled
        }
      }
    }
    video.addEventListener('seeked', onSeeked)
    video.addEventListener('loadedmetadata', onLoadedMetadata)

    const supportsRVFC = typeof rvfcVideo.requestVideoFrameCallback === 'function'
    if (!supportsRVFC) {
      const onTimeUpdate = () => setFrameIndex(Math.round(video.currentTime * fps))
      video.addEventListener('timeupdate', onTimeUpdate)
      return () => {
        video.removeEventListener('timeupdate', onTimeUpdate)
        video.removeEventListener('seeked', onSeeked)
        video.removeEventListener('loadedmetadata', onLoadedMetadata)
      }
    }

    let active = true
    let handle: number | undefined

    const onFrame = (_now: number, meta: RVFCMetadata) => {
      if (!active) return
      lastMediaTime.current = meta.mediaTime
      setFrameIndex(Math.round(meta.mediaTime * fps))
      handle = rvfcVideo.requestVideoFrameCallback!(onFrame)
    }

    handle = rvfcVideo.requestVideoFrameCallback!(onFrame)

    return () => {
      active = false
      if (handle !== undefined && typeof rvfcVideo.cancelVideoFrameCallback === 'function') {
        rvfcVideo.cancelVideoFrameCallback(handle)
      }
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
    }
  }, [video, fps])

  const seekToFrame = useCallback(
    (target: number) => {
      if (!video) return
      const max = Math.max(0, totalFrames - 1)
      const clamped = Math.max(0, totalFrames > 0 ? Math.min(max, target) : target)
      setFrameIndex(clamped)
      const targetTime = (clamped + 0.5) / fps
      // If metadata isn't loaded yet, stash the target and apply it on `loadedmetadata`.
      if (video.readyState < 1 || !isFinite(video.duration)) {
        pendingTarget.current = targetTime
        return
      }
      video.pause()
      try {
        video.currentTime = targetTime
      } catch {
        pendingTarget.current = targetTime
      }
    },
    [video, fps, totalFrames],
  )

  const step = useCallback(
    (direction: 1 | -1) => {
      seekToFrame(frameIndex + direction)
    },
    [frameIndex, seekToFrame],
  )

  return { frameIndex, totalFrames, step, seekToFrame }
}
