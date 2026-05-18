import { create } from 'zustand'
import type { AnnotationColor } from '../types'

interface AppState {
  currentColor: AnnotationColor
  setColor: (color: AnnotationColor) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentColor: 'red',
  setColor: (color) => set({ currentColor: color }),
}))
