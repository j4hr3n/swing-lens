import type { ReactNode } from 'react'
import { useAppStore } from '../../store/app'
import type { AnnotationColor, ToolId } from '../../types'
import { COLOR_ORDER, COLOR_VALUES } from '../../lib/colors'
import { IconAngle, IconCircle, IconLine, IconPen, IconTrash, IconUndo } from '../shared/Icons'

interface ToolPaletteProps {
  onUndo: () => void
  onClear: () => void
  canUndo: boolean
  canClear: boolean
}

const TOOLS: { id: ToolId; label: string; icon: ReactNode }[] = [
  { id: 'line', label: 'Line', icon: <IconLine size={18} /> },
  { id: 'circle', label: 'Circle', icon: <IconCircle size={18} /> },
  { id: 'freehand', label: 'Pen', icon: <IconPen size={18} /> },
  { id: 'angle', label: 'Angle', icon: <IconAngle size={18} /> },
]

export default function ToolPalette({ onUndo, onClear, canUndo, canClear }: ToolPaletteProps) {
  const currentTool = useAppStore((s) => s.currentTool)
  const currentColor = useAppStore((s) => s.currentColor)
  const setTool = useAppStore((s) => s.setTool)
  const setColor = useAppStore((s) => s.setColor)

  return (
    <div className="flex items-center gap-2 overflow-x-auto px-4 py-2.5">
      <span className="label-eyebrow-sm pr-0.5 text-[color:var(--color-text-muted)]" aria-hidden="true">
        Ch
      </span>
      <div className="flex gap-1">
        {COLOR_ORDER.map((color) => (
          <ColorSwatch
            key={color}
            color={color}
            active={color === currentColor}
            onSelect={() => setColor(color)}
          />
        ))}
      </div>

      <div className="mx-2 h-5 w-px bg-[color:var(--color-border)]" />

      <span className="label-eyebrow-sm pr-0.5 text-[color:var(--color-text-muted)]" aria-hidden="true">
        Tool
      </span>
      <div className="flex gap-0.5">
        {TOOLS.map((tool) => {
          const active = tool.id === currentTool
          return (
            <button
              key={tool.id}
              type="button"
              aria-label={tool.label}
              aria-pressed={active}
              onClick={() => setTool(tool.id)}
              className={
                'relative flex h-10 w-10 items-center justify-center transition-colors ' +
                (active
                  ? 'text-[color:var(--color-text)]'
                  : 'text-[color:var(--color-text-muted)] active:text-[color:var(--color-text)]')
              }
            >
              {tool.icon}
              <span
                className={
                  'pointer-events-none absolute bottom-1 left-1/2 h-px w-5 -translate-x-1/2 transition-colors ' +
                  (active ? 'bg-[color:var(--color-accent)]' : 'bg-transparent')
                }
              />
            </button>
          )
        })}
      </div>

      <div className="ml-auto flex gap-0.5">
        <button
          type="button"
          aria-label="Undo"
          disabled={!canUndo}
          onClick={onUndo}
          className="flex h-10 w-10 items-center justify-center text-[color:var(--color-text-muted)] active:text-[color:var(--color-text)] disabled:opacity-25"
        >
          <IconUndo size={18} />
        </button>
        <button
          type="button"
          aria-label="Clear all"
          disabled={!canClear}
          onClick={onClear}
          className="flex h-10 w-10 items-center justify-center text-[color:var(--color-text-muted)] active:text-[color:var(--color-danger)] disabled:opacity-25"
        >
          <IconTrash size={18} />
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
      className="relative flex h-8 w-8 items-center justify-center transition-transform active:scale-95"
    >
      <span
        className="block h-5 w-5"
        style={{
          background: COLOR_VALUES[color],
          borderRadius: '2px',
          boxShadow: active
            ? `0 0 0 1.5px var(--color-text), 0 0 0 3px var(--color-bg)`
            : 'none',
        }}
      />
      {active ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rotate-45 bg-[color:var(--color-accent)]"
        />
      ) : null}
    </button>
  )
}
