import { expect, it } from 'vitest'
import { parseMp4Fps } from './mp4Fps'

function ascii(text: string): Uint8Array {
  return Uint8Array.from(text, (char) => char.charCodeAt(0))
}

function uint32(value: number): Uint8Array {
  const bytes = new Uint8Array(4)
  new DataView(bytes.buffer).setUint32(0, value)
  return bytes
}

function bytes(...parts: Uint8Array[]): Uint8Array {
  const size = parts.reduce((sum, part) => sum + part.byteLength, 0)
  const out = new Uint8Array(size)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.byteLength
  }
  return out
}

function box(type: string, payload: Uint8Array): Uint8Array {
  return bytes(uint32(payload.byteLength + 8), ascii(type), payload)
}

function blobPart(part: Uint8Array): ArrayBuffer {
  return part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength) as ArrayBuffer
}

it('extracts rounded FPS from a video track stts table', async () => {
  const mdhd = box('mdhd', bytes(uint32(0), uint32(0), uint32(0), uint32(30_000)))
  const hdlr = box('hdlr', bytes(uint32(0), uint32(0), ascii('vide')))
  const stts = box('stts', bytes(uint32(0), uint32(1), uint32(300), uint32(1000)))
  const stbl = box('stbl', stts)
  const minf = box('minf', stbl)
  const mdia = box('mdia', bytes(mdhd, hdlr, minf))
  const trak = box('trak', mdia)
  const moov = box('moov', trak)
  const ftyp = box('ftyp', ascii('isom'))

  const file = new File([blobPart(ftyp), blobPart(moov)], 'clip.mp4', { type: 'video/mp4' })

  await expect(parseMp4Fps(file)).resolves.toBe(30)
})

it('returns undefined for malformed inputs', async () => {
  await expect(parseMp4Fps(new File([new Uint8Array([1, 2, 3])], 'bad.mp4'))).resolves.toBeUndefined()
})
