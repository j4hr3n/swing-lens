import { afterEach, describe, expect, it, vi } from 'vitest'

const readFile = vi.fn<() => Promise<File>>()

vi.mock('./opfs', () => ({
  readFile,
}))

afterEach(async () => {
  const { clearObjectUrlCachesForTests } = await import('./objectUrlCache')
  clearObjectUrlCachesForTests()
  vi.restoreAllMocks()
  readFile.mockReset()
})

describe('object URL cache', () => {
  it('deduplicates OPFS reads and revokes after the last release', async () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:cached')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    readFile.mockResolvedValue(new File(['video'], 'clip.mp4'))

    const { retainObjectUrl } = await import('./objectUrlCache')
    const first = await retainObjectUrl('clip.mp4')
    const second = await retainObjectUrl('clip.mp4')

    expect(first.url).toBe('blob:cached')
    expect(second.url).toBe('blob:cached')
    expect(readFile).toHaveBeenCalledTimes(1)
    expect(createObjectURL).toHaveBeenCalledTimes(1)

    first.release()
    expect(revokeObjectURL).not.toHaveBeenCalled()
    second.release()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:cached')
  })

  it('reuses blob URLs by explicit key', async () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:pending')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const { retainBlobObjectUrl } = await import('./objectUrlCache')
    const blob = new Blob(['video'])

    const first = retainBlobObjectUrl('pending', blob)
    const second = retainBlobObjectUrl('pending', blob)

    expect(first.url).toBe('blob:pending')
    expect(second.url).toBe('blob:pending')
    expect(createObjectURL).toHaveBeenCalledTimes(1)

    first.release()
    second.release()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:pending')
  })
})
