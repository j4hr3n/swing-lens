import Dexie, { type Table } from 'dexie'
import type { Recording } from '../types'

class SwingLensDB extends Dexie {
  recordings!: Table<Recording, string>

  constructor() {
    super('swing-lens')
    this.version(1).stores({
      recordings: 'id, createdAt',
    })
  }
}

export const db = new SwingLensDB()
