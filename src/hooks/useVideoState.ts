import { useEffect, useState, type RefObject } from 'react'

export interface VideoState {
  playing: boolean
  currentTime: number
  duration: number
  ready: boolean
}

export function useVideoState(ref: RefObject<HTMLVideoElement | null>): VideoState {
  const [state, setState] = useState<VideoState>({
    playing: false,
    currentTime: 0,
    duration: 0,
    ready: false,
  })

  useEffect(() => {
    const video = ref.current
    if (!video) return

    const update = (patch: Partial<VideoState>) => setState((prev) => ({ ...prev, ...patch }))

    const onLoaded = () => {
      const d = isFinite(video.duration) ? video.duration : 0
      update({ duration: d, currentTime: video.currentTime, ready: true })
    }
    const onDurationChange = () => {
      if (isFinite(video.duration)) update({ duration: video.duration })
    }
    const onTimeUpdate = () => update({ currentTime: video.currentTime })
    const onPlay = () => update({ playing: true })
    const onPause = () => update({ playing: false })
    const onSeeked = () => update({ currentTime: video.currentTime })

    video.addEventListener('loadedmetadata', onLoaded)
    video.addEventListener('durationchange', onDurationChange)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('seeked', onSeeked)

    if (video.readyState >= 1) onLoaded()

    return () => {
      video.removeEventListener('loadedmetadata', onLoaded)
      video.removeEventListener('durationchange', onDurationChange)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('seeked', onSeeked)
    }
  }, [ref])

  return state
}
