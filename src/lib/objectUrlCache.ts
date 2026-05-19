import { readFile } from './opfs'

export interface RetainedObjectUrl {
  url: string
  release: () => void
}

interface CacheEntry {
  promise: Promise<string>
  refs: number
  url?: string
}

const fileUrlCache = new Map<string, CacheEntry>()
const blobUrlCache = new Map<string, { url: string; refs: number }>()

export async function retainObjectUrl(fileName: string): Promise<RetainedObjectUrl> {
  let entry = fileUrlCache.get(fileName)
  if (!entry) {
    entry = {
      refs: 0,
      promise: readFile(fileName).then((file) => {
        const url = URL.createObjectURL(file)
        const current = fileUrlCache.get(fileName)
        if (current) current.url = url
        return url
      }),
    }
    fileUrlCache.set(fileName, entry)
  }

  entry.refs += 1
  const url = await entry.promise
  let released = false

  return {
    url,
    release: () => {
      if (released) return
      released = true
      const current = fileUrlCache.get(fileName)
      if (!current) return
      current.refs -= 1
      if (current.refs <= 0) {
        if (current.url) URL.revokeObjectURL(current.url)
        fileUrlCache.delete(fileName)
      }
    },
  }
}

export function retainBlobObjectUrl(key: string, blob: Blob): RetainedObjectUrl {
  let entry = blobUrlCache.get(key)
  if (!entry) {
    entry = { url: URL.createObjectURL(blob), refs: 0 }
    blobUrlCache.set(key, entry)
  }

  entry.refs += 1
  let released = false

  return {
    url: entry.url,
    release: () => {
      if (released) return
      released = true
      const current = blobUrlCache.get(key)
      if (!current) return
      current.refs -= 1
      if (current.refs <= 0) {
        URL.revokeObjectURL(current.url)
        blobUrlCache.delete(key)
      }
    },
  }
}

export function clearObjectUrlCachesForTests(): void {
  for (const entry of fileUrlCache.values()) {
    if (entry.url) URL.revokeObjectURL(entry.url)
  }
  for (const entry of blobUrlCache.values()) {
    URL.revokeObjectURL(entry.url)
  }
  fileUrlCache.clear()
  blobUrlCache.clear()
}
