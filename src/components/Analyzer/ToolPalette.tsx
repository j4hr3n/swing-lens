import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useAppStore } from '../../store/app'
import type { AnnotationColor, ToolId } from '../../types'
import { COLOR_ORDER, COLOR_VALUES } from '../../lib/colors'
import { IconAngle, IconCircle, IconLine, IconPen } from '../shared/Icons'

const TOOLS: { id: ToolId; label: string; icon: ReactNode }[] = [
  { id: 'line', label: 'Line', icon: <IconLine size={18} /> },
  { id: 'circle', label: 'Circle', icon: <IconCircle size={18} /> },
  { id: 'freehand', label: 'Pen', icon: <IconPen size={18} /> },
  { id: 'angle', label: 'Angle', icon: <IconAngle size={18} /> },
]

export default function ToolPalette() {
  const currentTool = useAppStore((s) => s.currentTool)
  const currentColor = useAppStore((s) => s.currentColor)
  const setTool = useAppStore((s) => s.setTool)
  const setColor = useAppStore((s) => s.setColor)

  return (
    <div className="flex items-center gap-1">
      <ColorPicker currentColor={currentColor} onSelect={setColor} />
      <div className="mx-1 h-4 w-px bg-white/15" />
      <div className="flex gap-0">
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
                'relative flex h-9 w-9 items-center justify-center transition-colors ' +
                (active
                  ? 'text-[color:var(--color-text)]'
                  : 'text-[color:var(--color-text-muted)] active:text-[color:var(--color-text)]')
              }
            >
              {tool.icon}
              <span
                className={
                  'pointer-events-none absolute bottom-1 left-1/2 h-px w-4 -translate-x-1/2 transition-colors ' +
                  (active ? 'bg-[color:var(--color-accent)]' : 'bg-transparent')
                }
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ColorPicker({
  currentColor,
  onSelect,
}: {
  currentColor: AnnotationColor
  onSelect: (c: AnnotationColor) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocPointer = (e: PointerEvent) => {
      if (!containerRef.current) return
      if (e.target instanceof Node && containerRef.current.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onDocPointer, true)
    return () => document.removeEventListener('pointerdown', onDocPointer, true)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={`Color (current: ${currentColor})`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center transition-transform active:scale-95"
      >
        <span
          className="block h-4 w-4"
          style={{
            background: COLOR_VALUES[currentColor],
            borderRadius: '2px',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.25)',
          }}
        />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute bottom-full left-0 mb-2 flex gap-0.5 border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-1 shadow-2xl"
        >
          {COLOR_ORDER.map((c) => (
            <ColorSwatch
              key={c}
              color={c}
              active={c === currentColor}
              onSelect={() => {
                onSelect(c)
                setOpen(false)
              }}
            />
          ))}
        </div>
      ) : null}
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
      className="relative flex h-7 w-7 items-center justify-center transition-transform active:scale-95"
    >
      <span
        className="block h-4 w-4"
        style={{
          background: COLOR_VALUES[color],
          borderRadius: '2px',
          boxShadow: active
            ? `0 0 0 1.5px var(--color-text), 0 0 0 3px rgba(0,0,0,0.7)`
            : 'none',
        }}
      />
    </button>
  )
}
