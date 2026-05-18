import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../store/app'
import type { AnnotationColor } from '../../types'
import { COLOR_ORDER, COLOR_VALUES } from '../../lib/colors'

export default function ToolPalette() {
  const currentColor = useAppStore((s) => s.currentColor)
  const setColor = useAppStore((s) => s.setColor)
  return <ColorPicker currentColor={currentColor} onSelect={setColor} />
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
