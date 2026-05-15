import { useEffect, useState } from 'react'
import { readFileURL } from '../lib/opfs'

export function useObjectUrl(fileName: string | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>()

  useEffect(() => {
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
  }, [fileName])

  return url
}
