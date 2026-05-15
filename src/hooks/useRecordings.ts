import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import type { Recording } from '../types'

export function useRecordings(): Recording[] | undefined {
  return useLiveQuery(() => db.recordings.orderBy('createdAt').reverse().toArray())
}

export function useRecording(id: string | undefined): Recording | undefined {
  return useLiveQuery(() => (id ? db.recordings.get(id) : undefined), [id])
}
