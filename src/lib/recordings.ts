import { format } from 'date-fns'
import { db } from './db'
import { deleteFile, writeFile } from './opfs'
import { detectContainerFps, probeFast } from './videoMeta'
import { uid } from './geometry'
import type { Annotation, Recording } from '../types'

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

// Holds the freshly-picked File so the analyzer can read it instantly without
// waiting for the OPFS write. Cleared once the OPFS copy is committed.
const pendingFileById = new Map<string, File>()

export function getPendingFile(id: string): File | undefined {
  return pendingFileById.get(id)
}

export interface ImportHandle {
  recording: Recording
  finalizeImport: Promise<void>
}

/**
 * Fast import: probe metadata only, insert a pending Recording row, stash the
 * File in-memory so the analyzer can read it, and return immediately. The
 * caller is expected to navigate to the analyzer at once. The returned
 * `finalize` promise resolves when the OPFS write + container FPS parse have
 * completed; failures mark the recording as `failed`.
 */
export async function importRecording(file: File): Promise<ImportHandle> {
  const id = uid()
  const ext = extOf(file)
  const videoFileName = `${id}.${ext}`

  const meta = await probeFast(file)
  pendingFileById.set(id, file)

  const now = new Date()
  const recording: Recording = {
    id,
    name: defaultName(now),
    videoFileName,
    duration: meta.duration,
    width: meta.width,
    height: meta.height,
    createdAt: now.getTime(),
    annotations: [],
    pending: true,
  }
  await db.recordings.add(recording)

  const finalizePromise = finalizeImportInBackground(id, file, videoFileName).catch(async (err) => {
    console.error('Import finalize failed', err)
    await markRecordingFailed(id).catch(() => {})
  })

  return { recording, finalizeImport: finalizePromise }
}

async function finalizeImportInBackground(
  id: string,
  file: File,
  videoFileName: string,
): Promise<void> {
  try {
    const [, fps] = await Promise.all([
      writeFile(videoFileName, file),
      detectContainerFps(file).catch(() => undefined),
    ])
    const patch: Partial<Recording> = { pending: false }
    if (fps && fps > 0) patch.fps = fps
    await db.recordings.update(id, patch)
  } finally {
    pendingFileById.delete(id)
  }
}

/** Persists a thumbnail captured from the analyzer's first decoded frame. */
export async function attachThumbnail(id: string, jpeg: Blob): Promise<void> {
  const thumbnailFileName = `${id}.jpg`
  await writeFile(thumbnailFileName, jpeg)
  await db.recordings.update(id, { thumbnailFileName })
}

export async function deleteRecording(id: string): Promise<void> {
  const rec = await db.recordings.get(id)
  if (!rec) return
  const tasks: Promise<unknown>[] = [deleteFile(rec.videoFileName)]
  if (rec.thumbnailFileName) tasks.push(deleteFile(rec.thumbnailFileName))
  await Promise.allSettled(tasks)
  await db.recordings.delete(id)
  pendingFileById.delete(id)
}

export async function renameRecording(id: string, name: string): Promise<void> {
  await db.recordings.update(id, { name })
}

export async function updateRecordingAnnotations(
  id: string,
  annotations: Annotation[],
): Promise<void> {
  await db.recordings.update(id, { annotations })
}

export async function updateRecordingAnnotation(
  id: string,
  annotationId: string,
  partial: Partial<Annotation>,
): Promise<void> {
  const recording = await db.recordings.get(id)
  if (!recording) return
  await updateRecordingAnnotations(
    id,
    recording.annotations.map((annotation) => (
      annotation.id === annotationId ? { ...annotation, ...partial } : annotation
    )),
  )
}

export async function clearRecordingAnnotations(id: string): Promise<void> {
  await updateRecordingAnnotations(id, [])
}

export async function markRecordingFailed(id: string): Promise<void> {
  await db.recordings.update(id, { failed: true, pending: false })
}

export function recordingStatus(recording: Recording): 'ready' | 'pending' | 'failed' {
  if (recording.failed) return 'failed'
  if (recording.pending) return 'pending'
  return 'ready'
}

/**
 * Used by the capture flow. The track's reported frame rate is authoritative,
 * so we skip the container parse and persist immediately.
 */
export async function commitCapture(opts: {
  blob: Blob
  ext: string
  mime: string
  width: number
  height: number
  durationSec: number
  fps: number
}): Promise<Recording> {
  const id = uid()
  const videoFileName = `${id}.${opts.ext}`
  const file = new File([opts.blob], videoFileName, { type: opts.mime })
  await writeFile(videoFileName, file)
  const now = new Date()
  const recording: Recording = {
    id,
    name: defaultName(now),
    videoFileName,
    fps: opts.fps,
    duration: opts.durationSec,
    width: opts.width,
    height: opts.height,
    createdAt: now.getTime(),
    annotations: [],
  }
  await db.recordings.add(recording)
  return recording
}
