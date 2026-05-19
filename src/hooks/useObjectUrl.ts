import { useEffect, useState } from 'react'
import { retainBlobObjectUrl, retainObjectUrl } from '../lib/objectUrlCache'

/**
 * Returns an object URL for an OPFS file. If `pendingFile` is provided, it
 * takes precedence — used to display a freshly-imported video before the OPFS
 * write has committed.
 */
export function useObjectUrl(
  fileName: string | undefined,
  pendingFile?: File,
): string | undefined {
  const [url, setUrl] = useState<string | undefined>()

  useEffect(() => {
    let active = true
    let release: (() => void) | undefined

    if (pendingFile) {
      const retained = retainBlobObjectUrl(`pending:${pendingFile.name}:${pendingFile.size}:${pendingFile.lastModified}`, pendingFile)
      setUrl(retained.url)
      return () => {
        retained.release()
        setUrl(undefined)
      }
    }
    if (!fileName) {
      setUrl(undefined)
      return
    }
    retainObjectUrl(fileName)
      .then((retained) => {
        if (!active) {
          retained.release()
          return
        }
        release = retained.release
        setUrl(retained.url)
      })
      .catch(() => setUrl(undefined))
    return () => {
      active = false
      release?.()
      setUrl(undefined)
    }
  }, [fileName, pendingFile])

  return url
}
