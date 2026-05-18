import { useEffect, useState } from 'react'
import { readFileURL } from '../lib/opfs'

/**
 * Returns an object URL for an OPFS file. If `pendingFile` is provided, it
 * takes precedence — used to display a freshly-imported video before the OPFS
 * write has committed.
 */
export function useObjectUrl(
  fileName: string | undefined,
  pendingFile?: File | undefined,
): string | undefined {
  const [url, setUrl] = useState<string | undefined>()

  useEffect(() => {
    if (pendingFile) {
      const u = URL.createObjectURL(pendingFile)
      setUrl(u)
      return () => {
        URL.revokeObjectURL(u)
        setUrl(undefined)
      }
    }
    if (!fileName) {
      setUrl(undefined)
      return
    }
    let revoked = false
    let createdUrl: string | undefined
    readFileURL(fileName)
      .then((u) => {
        if (revoked) {
          URL.revokeObjectURL(u)
          return
        }
        createdUrl = u
        setUrl(u)
      })
      .catch(() => setUrl(undefined))
    return () => {
      revoked = true
      if (createdUrl) URL.revokeObjectURL(createdUrl)
      setUrl(undefined)
    }
  }, [fileName, pendingFile])

  return url
}
