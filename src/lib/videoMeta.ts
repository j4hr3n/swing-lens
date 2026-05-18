import { parseMp4Fps } from './mp4Fps'

export interface FastMeta {
  width: number
  height: number
  duration: number
}

/**
 * Metadata-only probe: width, height, duration. No seek, no thumbnail, no
 * container parse. Optimized for "navigate to the analyzer instantly" — runs
 * in ~tens of ms for most files. iPhone .mov files report `duration === Infinity`
 * after loadedmetadata; we apply the well-known Safari workaround (seek past
 * end → durationchange) to recover a real value.
 */
export async function probeFast(file: File): Promise<FastMeta> {
  const url = URL.createObjectURL(file)
  try {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.src = url

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error('Failed to load video metadata'))
    })

    const width = video.videoWidth
    const height = video.videoHeight
    let duration = video.duration
    if (!isFinite(duration) || isNaN(duration)) {
      duration = await resolveInfiniteDuration(video)
    }
    return { width, height, duration }
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Seek target large enough that any real media reports its true duration via
// `durationchange` (Safari quirk). The element clamps `currentTime` back into
// the valid range — we discard the side effect by resetting to 0.
const SAFARI_DURATION_PROBE_TIME = 1e101

async function resolveInfiniteDuration(video: HTMLVideoElement): Promise<number> {
  return new Promise((resolve) => {
    const cleanup = () => {
      video.removeEventListener('durationchange', onDurationChange)
      video.removeEventListener('timeupdate', onTimeUpdate)
    }
    const finish = () => {
      const d = video.duration
      cleanup()
      try {
        video.currentTime = 0
      } catch {
        // ignore
      }
      resolve(isFinite(d) ? d : 0)
    }
    const onDurationChange = () => {
      if (isFinite(video.duration)) finish()
    }
    const onTimeUpdate = () => {
      if (isFinite(video.duration)) finish()
    }
    video.addEventListener('durationchange', onDurationChange)
    video.addEventListener('timeupdate', onTimeUpdate)
    try {
      video.currentTime = SAFARI_DURATION_PROBE_TIME
    } catch {
      cleanup()
      resolve(0)
    }
  })
}

export async function detectContainerFps(file: File): Promise<number | undefined> {
  return parseMp4Fps(file)
}

/** Captures the currently-displayed frame of `video` as a JPEG blob. */
export async function captureFrameThumbnail(video: HTMLVideoElement): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(video, 0, 0)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to capture thumbnail'))
      },
      'image/jpeg',
      0.8,
    )
  })
}
