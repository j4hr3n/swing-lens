import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
  const totalFrames = useMemo(
    () => Math.max(0, Math.round((isFinite(duration) ? duration : 0) * fps)),
    [duration, fps],
  )
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const frameIndexRef = useRef(0)
  const pendingTarget = useRef<number | undefined>(undefined)
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    videoRef.current = video
  }, [video])

  const commitFrameIndex = useCallback((next: number) => {
    const clamped = Math.max(0, totalFrames > 0 ? Math.min(totalFrames - 1, next) : next)
    if (frameIndexRef.current === clamped) return
    frameIndexRef.current = clamped
    setFrameIndex(clamped)
  }, [totalFrames])

  useEffect(() => {
    if (!video) return
    const rvfcVideo = video as RVFCVideo

    const frameFromTime = (time: number) => Math.round(time * fps)
    const onSeeked = () => commitFrameIndex(frameFromTime(video.currentTime))
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
      const onTimeUpdate = () => commitFrameIndex(frameFromTime(video.currentTime))
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
      const next = frameFromTime(meta.mediaTime)
      if (rafRef.current === undefined && next !== frameIndexRef.current) {
        rafRef.current = window.requestAnimationFrame(() => {
          rafRef.current = undefined
          commitFrameIndex(next)
        })
      }
      handle = rvfcVideo.requestVideoFrameCallback(onFrame)
    }

    handle = rvfcVideo.requestVideoFrameCallback(onFrame)

    return () => {
      active = false
      if (handle !== undefined && typeof rvfcVideo.cancelVideoFrameCallback === 'function') {
        rvfcVideo.cancelVideoFrameCallback(handle)
      }
      if (rafRef.current !== undefined) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = undefined
      }
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
    }
  }, [video, fps, commitFrameIndex])

  const seekToFrame = useCallback(
    (target: number) => {
      const currentVideo = videoRef.current
      if (!currentVideo) return
      const max = Math.max(0, totalFrames - 1)
      const clamped = Math.max(0, totalFrames > 0 ? Math.min(max, target) : target)
      commitFrameIndex(clamped)
      const targetTime = (clamped + 0.5) / fps
      // If metadata isn't loaded yet, stash the target and apply it on `loadedmetadata`.
      if (currentVideo.readyState < 1 || !isFinite(currentVideo.duration)) {
        pendingTarget.current = targetTime
        return
      }
      currentVideo.pause()
      try {
        currentVideo.currentTime = targetTime
      } catch {
        pendingTarget.current = targetTime
      }
    },
    [commitFrameIndex, fps, totalFrames],
  )

  const step = useCallback(
    (direction: 1 | -1) => {
      seekToFrame(frameIndexRef.current + direction)
    },
    [seekToFrame],
  )

  return useMemo(
    () => ({ frameIndex, totalFrames, step, seekToFrame }),
    [frameIndex, totalFrames, step, seekToFrame],
  )
}
