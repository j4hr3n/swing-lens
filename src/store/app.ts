import { create } from 'zustand'
import type { AnnotationColor, ToolId } from '../types'

interface AppState {
  currentTool: ToolId
  currentColor: AnnotationColor
  setTool: (tool: ToolId) => void
  setColor: (color: AnnotationColor) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentTool: 'line',
  currentColor: 'red',
  setTool: (tool) => set({ currentTool: tool }),
  setColor: (color) => set({ currentColor: color }),
}))
