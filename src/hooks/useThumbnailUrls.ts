import { useEffect, useMemo, useState } from 'react'
import { retainObjectUrl } from '../lib/objectUrlCache'
import type { Recording } from '../types'

export function useThumbnailUrls(
  recordings: Recording[] | undefined,
  visibleIds: ReadonlySet<string>,
): Map<string, string> {
  const [urls, setUrls] = useState<Map<string, string>>(() => new Map())
  const names = useMemo(() => {
    if (!recordings) return []
    return recordings
      .filter((recording): recording is Recording & { thumbnailFileName: string } => (
        Boolean(recording.thumbnailFileName) && visibleIds.has(recording.id)
      ))
      .map((recording) => [recording.id, recording.thumbnailFileName] as const)
  }, [recordings, visibleIds])

  useEffect(() => {
    let active = true
    const releases: Array<() => void> = []
    setUrls(new Map())

    for (const [id, fileName] of names) {
      retainObjectUrl(fileName)
        .then((retained) => {
          if (!active) {
            retained.release()
            return
          }
          releases.push(retained.release)
          setUrls((current) => {
            const next = new Map(current)
            next.set(id, retained.url)
            return next
          })
        })
        .catch(() => {})
    }

    return () => {
      active = false
      for (const release of releases) release()
    }
  }, [names])

  return urls
}
