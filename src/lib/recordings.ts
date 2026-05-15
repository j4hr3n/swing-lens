import { format } from 'date-fns'
import { db } from './db'
import { deleteFile, writeFile } from './opfs'
import { probeVideo } from './videoMeta'
import { uid } from './geometry'
import type { Recording } from '../types'

function defaultName(at: Date): string {
  return `Swing — ${format(at, "MMM d, yyyy HH:mm")}`
}

function extOf(file: File): string {
  const match = file.name.match(/\.([a-zA-Z0-9]+)$/)
  if (match) return match[1].toLowerCase()
  if (file.type === 'video/mp4') return 'mp4'
  if (file.type === 'video/quicktime') return 'mov'
  if (file.type === 'video/webm') return 'webm'
  return 'mp4'
}

export async function importRecording(file: File): Promise<Recording> {
  const id = uid()
  const ext = extOf(file)
  const videoFileName = `${id}.${ext}`
  const thumbnailFileName = `${id}.jpg`

  const videoWritePromise = writeFile(videoFileName, file)
  const { meta, thumbnail } = await probeVideo(file)
  await Promise.all([videoWritePromise, writeFile(thumbnailFileName, thumbnail)])

  const now = new Date()
  const recording: Recording = {
    id,
    name: defaultName(now),
    videoFileName,
    thumbnailFileName,
    fps: meta.fps,
    duration: meta.duration,
    width: meta.width,
    height: meta.height,
    createdAt: now.getTime(),
    annotations: [],
  }
  await db.recordings.add(recording)
  return recording
}

export async function deleteRecording(id: string): Promise<void> {
  const rec = await db.recordings.get(id)
  if (!rec) return
  await Promise.allSettled([
    deleteFile(rec.videoFileName),
    deleteFile(rec.thumbnailFileName),
  ])
  await db.recordings.delete(id)
}

export async function renameRecording(id: string, name: string): Promise<void> {
  await db.recordings.update(id, { name })
}
