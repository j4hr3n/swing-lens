import { useEffect, useState } from 'react'

export interface VideoState {
  playing: boolean
  currentTime: number
  duration: number
  ready: boolean
}

export function useVideoState(video: HTMLVideoElement | null): VideoState {
  const [state, setState] = useState<VideoState>({
    playing: false,
    currentTime: 0,
    duration: 0,
    ready: false,
  })

  useEffect(() => {
    if (!video) return

    const update = (patch: Partial<VideoState>) => setState((prev) => ({ ...prev, ...patch }))

    const onLoaded = () => {
      const d = isFinite(video.duration) ? video.duration : 0
      update({ duration: d, currentTime: video.currentTime, ready: true })
    }
    const onDurationChange = () => {
      const d = video.duration
      if (!isFinite(d)) return
      setState((prev) => (prev.duration === d ? prev : { ...prev, duration: d }))
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
    update({ playing: !video.paused })

    return () => {
      video.removeEventListener('loadedmetadata', onLoaded)
      video.removeEventListener('durationchange', onDurationChange)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('seeked', onSeeked)
    }
  }, [video])

  return state
}
