export interface ProbedMetadata {
  width: number
  height: number
  duration: number
  fps: number
}

export async function probeVideo(file: File): Promise<{ meta: ProbedMetadata; thumbnail: Blob }> {
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
    const duration = video.duration

    const fps = await measureFps(video)
    const thumbnail = await extractThumbnail(video)
    return {
      meta: { width, height, duration, fps },
      thumbnail,
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function measureFps(video: HTMLVideoElement): Promise<number> {
  const supportsRVFC = typeof (video as HTMLVideoElement & { requestVideoFrameCallback?: unknown }).requestVideoFrameCallback === 'function'
  if (!supportsRVFC) return 30
  type RVFCMetadata = { mediaTime: number }
  const rvfc = (video as HTMLVideoElement & { requestVideoFrameCallback: (cb: (now: number, meta: RVFCMetadata) => void) => number }).requestVideoFrameCallback.bind(video)

  await video.play().catch(() => {})

  const samples: number[] = []
  await new Promise<void>((resolve) => {
    const onFrame = (_now: number, meta: RVFCMetadata) => {
      samples.push(meta.mediaTime)
      if (samples.length >= 5) resolve()
      else rvfc(onFrame)
    }
    rvfc(onFrame)
  })
  video.pause()

  if (samples.length < 2) return 30
  const deltas: number[] = []
  for (let i = 1; i < samples.length; i++) {
    deltas.push(samples[i] - samples[i - 1])
  }
  deltas.sort((a, b) => a - b)
  const median = deltas[Math.floor(deltas.length / 2)]
  if (!median || median <= 0) return 30
  return Math.round(1 / median)
}

async function extractThumbnail(video: HTMLVideoElement): Promise<Blob> {
  const seekTo = Math.min(0.1, Math.max(0, video.duration / 2))
  await seek(video, seekTo)
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(video, 0, 0)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to extract thumbnail'))
    }, 'image/jpeg', 0.8)
  })
}

function seek(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked)
      resolve()
    }
    video.addEventListener('seeked', onSeeked)
    video.currentTime = time
  })
}
