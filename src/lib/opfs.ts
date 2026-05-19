async function root(): Promise<FileSystemDirectoryHandle> {
  if (!('storage' in navigator) || typeof navigator.storage.getDirectory !== 'function') {
    throw new Error('This browser does not support local video storage. Use a current Safari, Chrome, or Edge browser.')
  }
  return navigator.storage.getDirectory()
}

export async function writeFile(name: string, data: Blob): Promise<void> {
  const dir = await root()
  const handle = await dir.getFileHandle(name, { create: true })
  const writable = await handle.createWritable()
  await writable.write(data)
  await writable.close()
}

export async function readFile(name: string): Promise<File> {
  const dir = await root()
  const handle = await dir.getFileHandle(name)
  return handle.getFile()
}

export async function readFileURL(name: string): Promise<string> {
  const file = await readFile(name)
  return URL.createObjectURL(file)
}

export async function deleteFile(name: string): Promise<void> {
  const dir = await root()
  try {
    await dir.removeEntry(name)
  } catch (err) {
    if ((err as DOMException).name !== 'NotFoundError') throw err
  }
}

export async function listFiles(): Promise<string[]> {
  const dir = await root()
  const names: string[] = []
  for await (const [name] of dir) names.push(name)
  return names
}

export async function clearAll(): Promise<void> {
  const dir = await root()
  for await (const [name] of dir) {
    await dir.removeEntry(name)
  }
}
