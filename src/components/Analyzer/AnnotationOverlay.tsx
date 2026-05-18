import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../store/app'
import { COLOR_VALUES } from '../../lib/colors'
import { clamp01, distance, uid } from '../../lib/geometry'
import type { Annotation, AnnotationColor, Pt } from '../../types'

interface AnnotationOverlayProps {
  annotations: Annotation[]
  onCommit: (annotation: Annotation) => void
  onUpdate: (id: string, partial: Partial<Annotation>) => void
}

type LineEditing = { id: string; endpoint: 'a' | 'b'; draft: { a: Pt; b: Pt } } | undefined

export default function AnnotationOverlay({ annotations, onCommit, onUpdate }: AnnotationOverlayProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const color = useAppStore((s) => s.currentColor)
  const [drawing, setDrawing] = useState<{ color: AnnotationColor; a: Pt; b: Pt } | undefined>()
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [editing, setEditing] = useState<LineEditing>()
  const dragCleanupRef = useRef<(() => void) | undefined>(undefined)

  const ptFromClient = (clientX: number, clientY: number): Pt => {
    const svg = svgRef.current!
    const rect = svg.getBoundingClientRect()
    const x = (clientX - rect.left) / rect.width
    const y = (clientY - rect.top) / rect.height
    return [clamp01(x), clamp01(y)]
  }

  const ptFrom = (e: React.PointerEvent): Pt => ptFromClient(e.clientX, e.clientY)

  useEffect(() => {
    if (selectedId && !annotations.some((a) => a.id === selectedId)) {
      setSelectedId(undefined)
    }
  }, [annotations, selectedId])

  useEffect(() => () => {
    dragCleanupRef.current?.()
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = ptFrom(e)
    if (selectedId) setSelectedId(undefined)
    setDrawing({ color, a: p, b: p })
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawing) return
    const p = ptFrom(e)
    setDrawing((d) => (d ? { ...d, b: p } : d))
  }

  const onPointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (!drawing) return
    if (distance(drawing.a, drawing.b) > 0.01) {
      onCommit({ id: uid(), type: 'line', color: drawing.color, a: drawing.a, b: drawing.b })
    }
    setDrawing(undefined)
  }

  const onSelectLine = (id: string) => (e: React.PointerEvent) => {
    e.stopPropagation()
    setSelectedId(id)
  }

  const beginEditHandle = (line: Annotation, endpoint: 'a' | 'b') => (e: React.PointerEvent) => {
    e.stopPropagation()
    setEditing({ id: line.id, endpoint, draft: { a: line.a, b: line.b } })

    const onMove = (ev: PointerEvent) => {
      const p = ptFromClient(ev.clientX, ev.clientY)
      setEditing((cur) => {
        if (!cur || cur.id !== line.id) return cur
        return { ...cur, draft: { ...cur.draft, [endpoint]: p } }
      })
    }
    const cleanup = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      dragCleanupRef.current = undefined
    }
    const onUp = (ev: PointerEvent) => {
      cleanup()
      const p = ptFromClient(ev.clientX, ev.clientY)
      onUpdate(line.id, { [endpoint]: p })
      setEditing(undefined)
    }
    dragCleanupRef.current = cleanup
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  const selectedLine = useMemo(
    () => (selectedId ? annotations.find((x) => x.id === selectedId) : undefined),
    [annotations, selectedId],
  )

  const handleEndpoints =
    selectedLine && editing?.id === selectedLine.id
      ? editing.draft
      : selectedLine
        ? { a: selectedLine.a, b: selectedLine.b }
        : undefined

  return (
    <>
      <svg
        ref={svgRef}
        className="absolute inset-0 h-full w-full touch-none"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {annotations.map((a) => {
          const useDraft = editing && editing.id === a.id ? editing.draft : { a: a.a, b: a.b }
          const isSelected = selectedId === a.id
          return (
            <g key={a.id} onPointerDown={onSelectLine(a.id)} style={{ cursor: 'pointer' }}>
              <Line a={useDraft.a} b={useDraft.b} stroke={COLOR_VALUES[a.color]} bold={isSelected} />
              <line
                x1={useDraft.a[0] * 1000}
                y1={useDraft.a[1] * 1000}
                x2={useDraft.b[0] * 1000}
                y2={useDraft.b[1] * 1000}
                stroke="transparent"
                strokeWidth={32}
                pointerEvents="stroke"
                strokeLinecap="round"
              />
            </g>
          )
        })}
        {drawing ? <Line a={drawing.a} b={drawing.b} stroke={COLOR_VALUES[drawing.color]} /> : null}
      </svg>

      {selectedLine && handleEndpoints ? (
        <div className="pointer-events-none absolute inset-0">
          <Handle
            color={COLOR_VALUES[selectedLine.color]}
            position={handleEndpoints.a}
            onPointerDown={beginEditHandle(selectedLine, 'a')}
          />
          <Handle
            color={COLOR_VALUES[selectedLine.color]}
            position={handleEndpoints.b}
            onPointerDown={beginEditHandle(selectedLine, 'b')}
          />
        </div>
      ) : null}
    </>
  )
}

function Handle({
  position,
  color,
  onPointerDown,
}: {
  position: Pt
  color: string
  onPointerDown: (e: React.PointerEvent) => void
}) {
  return (
    <div
      className="pointer-events-auto absolute touch-none"
      style={{
        left: `${position[0] * 100}%`,
        top: `${position[1] * 100}%`,
        transform: 'translate(-50%, -50%)',
        width: 44,
        height: 44,
      }}
      onPointerDown={onPointerDown}
    >
      <svg width={44} height={44} viewBox="0 0 44 44" aria-hidden="true">
        <circle cx={22} cy={22} r={11} fill="rgba(0,0,0,0.45)" stroke={color} strokeWidth={2} strokeDasharray="3 3" />
        <circle cx={22} cy={22} r={3.5} fill={color} />
      </svg>
    </div>
  )
}

function Line({ a, b, stroke, bold = false }: { a: Pt; b: Pt; stroke: string; bold?: boolean }) {
  return (
    <line
      x1={a[0] * 1000}
      y1={a[1] * 1000}
      x2={b[0] * 1000}
      y2={b[1] * 1000}
      stroke={stroke}
      strokeWidth={bold ? 5 : 4}
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
  )
}
