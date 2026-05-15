/**
 * Minimal MP4 / QuickTime (.mov) box parser to extract the encoded video frame rate.
 *
 * We only look inside the `moov` atom — specifically each `trak` whose
 * `mdia/hdlr` handler-type is `vide`, then read `mdia/mdhd` timescale and
 * `mdia/minf/stbl/stts` sample-duration entries to compute FPS without
 * having to play the file.
 *
 * Returns `undefined` if the file isn't MP4/MOV or the relevant boxes can't
 * be found — callers fall back to runtime measurement.
 */
export async function parseMp4Fps(file: File): Promise<number | undefined> {
  try {
    const moov = await readMoov(file)
    if (!moov) return undefined
    return fpsFromMoov(moov)
  } catch {
    return undefined
  }
}

async function readMoov(file: File): Promise<DataView | undefined> {
  const size = file.size
  if (size < 16) return undefined

  // Walk top-level atoms. moov can be at the start or end of the file; we
  // read 1 MB chunks to find it without loading the whole file.
  let offset = 0
  while (offset + 8 <= size) {
    const headerEnd = Math.min(offset + 16, size)
    const headerBuf = await file.slice(offset, headerEnd).arrayBuffer()
    const headerView = new DataView(headerBuf)
    let boxSize = headerView.getUint32(0)
    const type = readType(headerView, 4)
    let headerLen = 8
    if (boxSize === 1) {
      if (headerEnd - offset < 16) return undefined
      const hi = headerView.getUint32(8)
      const lo = headerView.getUint32(12)
      boxSize = hi * 2 ** 32 + lo
      headerLen = 16
    } else if (boxSize === 0) {
      boxSize = size - offset
    }
    if (boxSize < headerLen) return undefined

    if (type === 'moov') {
      const payloadStart = offset + headerLen
      const payloadEnd = offset + boxSize
      const buf = await file.slice(payloadStart, payloadEnd).arrayBuffer()
      return new DataView(buf)
    }

    offset += boxSize
  }
  return undefined
}

function fpsFromMoov(moov: DataView): number | undefined {
  // Iterate `trak` children of `moov` and look for a video track.
  const traks = findChildren(moov, 0, moov.byteLength, 'trak')
  for (const trak of traks) {
    const mdiaRange = findChild(moov, trak.start, trak.end, 'mdia')
    if (!mdiaRange) continue
    const hdlrRange = findChild(moov, mdiaRange.start, mdiaRange.end, 'hdlr')
    if (!hdlrRange) continue
    // hdlr: 1-byte version + 3-byte flags + 4-byte predefined + 4-byte handler_type
    const handlerType = readType(moov, hdlrRange.start + 8)
    if (handlerType !== 'vide') continue

    const mdhdRange = findChild(moov, mdiaRange.start, mdiaRange.end, 'mdhd')
    if (!mdhdRange) continue
    const timescale = readTimescale(moov, mdhdRange.start)
    if (!timescale) continue

    const minfRange = findChild(moov, mdiaRange.start, mdiaRange.end, 'minf')
    if (!minfRange) continue
    const stblRange = findChild(moov, minfRange.start, minfRange.end, 'stbl')
    if (!stblRange) continue
    const sttsRange = findChild(moov, stblRange.start, stblRange.end, 'stts')
    if (!sttsRange) continue

    const stats = readStts(moov, sttsRange.start)
    if (!stats || stats.totalSamples === 0 || stats.totalDuration === 0) continue

    const seconds = stats.totalDuration / timescale
    if (!isFinite(seconds) || seconds <= 0) continue
    const fps = stats.totalSamples / seconds
    if (!isFinite(fps) || fps <= 0) continue
    return Math.round(fps)
  }
  return undefined
}

interface Range {
  start: number
  end: number
}

function findChild(view: DataView, start: number, end: number, type: string): Range | undefined {
  let offset = start
  while (offset + 8 <= end) {
    let boxSize = view.getUint32(offset)
    const t = readType(view, offset + 4)
    let headerLen = 8
    if (boxSize === 1) {
      if (offset + 16 > end) return undefined
      const hi = view.getUint32(offset + 8)
      const lo = view.getUint32(offset + 12)
      boxSize = hi * 2 ** 32 + lo
      headerLen = 16
    } else if (boxSize === 0) {
      boxSize = end - offset
    }
    if (boxSize < headerLen || offset + boxSize > end) return undefined
    if (t === type) {
      return { start: offset + headerLen, end: offset + boxSize }
    }
    offset += boxSize
  }
  return undefined
}

function findChildren(view: DataView, start: number, end: number, type: string): Range[] {
  const out: Range[] = []
  let offset = start
  while (offset + 8 <= end) {
    let boxSize = view.getUint32(offset)
    const t = readType(view, offset + 4)
    let headerLen = 8
    if (boxSize === 1) {
      if (offset + 16 > end) break
      const hi = view.getUint32(offset + 8)
      const lo = view.getUint32(offset + 12)
      boxSize = hi * 2 ** 32 + lo
      headerLen = 16
    } else if (boxSize === 0) {
      boxSize = end - offset
    }
    if (boxSize < headerLen || offset + boxSize > end) break
    if (t === type) out.push({ start: offset + headerLen, end: offset + boxSize })
    offset += boxSize
  }
  return out
}

function readType(view: DataView, offset: number): string {
  return (
    String.fromCharCode(view.getUint8(offset)) +
    String.fromCharCode(view.getUint8(offset + 1)) +
    String.fromCharCode(view.getUint8(offset + 2)) +
    String.fromCharCode(view.getUint8(offset + 3))
  )
}

function readTimescale(view: DataView, start: number): number | undefined {
  const version = view.getUint8(start)
  // skip version(1) + flags(3) + creation_time + modification_time
  const skip = version === 1 ? 8 + 8 + 8 : 8 + 4 + 4
  const tsOffset = start + skip
  if (tsOffset + 4 > view.byteLength) return undefined
  return view.getUint32(tsOffset)
}

function readStts(
  view: DataView,
  start: number,
): { totalSamples: number; totalDuration: number } | undefined {
  // 1 byte version + 3 bytes flags + 4 bytes entry_count + entries (8 bytes each)
  if (start + 8 > view.byteLength) return undefined
  const entryCount = view.getUint32(start + 4)
  let totalSamples = 0
  let totalDuration = 0
  let cursor = start + 8
  for (let i = 0; i < entryCount; i++) {
    if (cursor + 8 > view.byteLength) return undefined
    const sampleCount = view.getUint32(cursor)
    const sampleDelta = view.getUint32(cursor + 4)
    totalSamples += sampleCount
    totalDuration += sampleCount * sampleDelta
    cursor += 8
  }
  return { totalSamples, totalDuration }
}
