import type { ReactNode } from 'react'
import { useAppStore } from '../../store/app'
import type { AnnotationColor, ToolId } from '../../types'
import { COLOR_ORDER, COLOR_VALUES } from '../../lib/colors'

interface ToolPaletteProps {
  onUndo: () => void
  onClear: () => void
  canUndo: boolean
  canClear: boolean
}

const TOOLS: { id: ToolId; label: string; icon: ReactNode }[] = [
  {
    id: 'line',
    label: 'Line',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <line x1="5" y1="19" x2="19" y2="5" />
      </svg>
    ),
  },
  {
    id: 'circle',
    label: 'Circle',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="7" />
      </svg>
    ),
  },
  {
    id: 'freehand',
    label: 'Pen',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M5 19c2-7 7-3 9-9s-2-5 5-7" />
      </svg>
    ),
  },
  {
    id: 'angle',
    label: 'Angle',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <polyline points="4,20 4,4 20,20" />
        <path d="M9.5 20a6 6 0 0 0 -5.5 -5.5" />
      </svg>
    ),
  },
]

export default function ToolPalette({ onUndo, onClear, canUndo, canClear }: ToolPaletteProps) {
  const currentTool = useAppStore((s) => s.currentTool)
  const currentColor = useAppStore((s) => s.currentColor)
  const setTool = useAppStore((s) => s.setTool)
  const setColor = useAppStore((s) => s.setColor)

  return (
    <div className="flex items-center gap-2 overflow-x-auto px-3 py-2">
      <div className="flex gap-1.5">
        {COLOR_ORDER.map((color) => (
          <ColorSwatch
            key={color}
            color={color}
            active={color === currentColor}
            onSelect={() => setColor(color)}
          />
        ))}
      </div>
      <div className="mx-1 h-6 w-px bg-[color:var(--color-border)]" />
      <div className="flex gap-1">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            aria-label={tool.label}
            aria-pressed={tool.id === currentTool}
            onClick={() => setTool(tool.id)}
            className={
              'flex h-10 w-10 items-center justify-center rounded-full ' +
              (tool.id === currentTool
                ? 'bg-[color:var(--color-accent)] text-black'
                : 'bg-[color:var(--color-bg-elevated)] text-[color:var(--color-text-muted)]')
            }
          >
            {tool.icon}
          </button>
        ))}
      </div>
      <div className="ml-auto flex gap-1">
        <button
          type="button"
          aria-label="Undo"
          disabled={!canUndo}
          onClick={onUndo}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-bg-elevated)] text-[color:var(--color-text-muted)] disabled:opacity-30"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 14l-5 -5 5 -5" />
            <path d="M4 9h12a4 4 0 0 1 4 4v0a4 4 0 0 1 -4 4h-7" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Clear all"
          disabled={!canClear}
          onClick={onClear}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-bg-elevated)] text-[color:var(--color-text-muted)] disabled:opacity-30"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="3,6 5,6 21,6" />
            <path d="M19 6l-1 14a2 2 0 0 1 -2 2H8a2 2 0 0 1 -2 -2L5 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function ColorSwatch({
  color,
  active,
  onSelect,
}: {
  color: AnnotationColor
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-label={`Color ${color}`}
      aria-pressed={active}
      onClick={onSelect}
      className="relative flex h-9 w-9 items-center justify-center rounded-full active:scale-95"
      style={{
        background: COLOR_VALUES[color],
        outline: active ? '2px solid #fff' : 'none',
        outlineOffset: active ? '2px' : '0',
      }}
    />
  )
}
