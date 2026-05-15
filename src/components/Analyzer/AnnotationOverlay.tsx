import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../store/app'
import { COLOR_VALUES } from '../../lib/colors'
import { uid, angleDegrees, distance } from '../../lib/geometry'
import type { Annotation, AnnotationColor, Pt } from '../../types'

interface AnnotationOverlayProps {
  annotations: Annotation[]
  onCommit: (annotation: Annotation) => void
}

type DragDrawing =
  | { kind: 'freehand'; color: AnnotationColor; points: Pt[] }
  | { kind: 'line'; color: AnnotationColor; a: Pt; b: Pt }
  | { kind: 'circle'; color: AnnotationColor; center: Pt; radius: number }

type AnglePartial =
  | undefined
  | { vertex: Pt; color: AnnotationColor }
  | { vertex: Pt; a: Pt; color: AnnotationColor }

export default function AnnotationOverlay({ annotations, onCommit }: AnnotationOverlayProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const tool = useAppStore((s) => s.currentTool)
  const color = useAppStore((s) => s.currentColor)
  const [drawing, setDrawing] = useState<DragDrawing | undefined>()
  const [anglePartial, setAnglePartial] = useState<AnglePartial>(undefined)

  const ptFrom = (e: React.PointerEvent): Pt => {
    const svg = svgRef.current!
    const rect = svg.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    return [clamp01(x), clamp01(y)]
  }

  // Reset the angle partial when the tool changes away from angle
  useEffect(() => {
    if (tool !== 'angle') setAnglePartial(undefined)
  }, [tool])

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = ptFrom(e)
    switch (tool) {
      case 'freehand':
        setDrawing({ kind: 'freehand', color, points: [p] })
        break
      case 'line':
        setDrawing({ kind: 'line', color, a: p, b: p })
        break
      case 'circle':
        setDrawing({ kind: 'circle', color, center: p, radius: 0 })
        break
      case 'angle':
        // angle uses tap-based state machine on pointerup, not drag-based
        break
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawing) return
    const p = ptFrom(e)
    setDrawing((d) => {
      if (!d) return d
      switch (d.kind) {
        case 'freehand':
          return { ...d, points: [...d.points, p] }
        case 'line':
          return { ...d, b: p }
        case 'circle':
          return { ...d, radius: distance(d.center, p) }
      }
    })
  }

  const onPointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    const p = ptFrom(e)

    // Angle tool uses tap-based interaction
    if (tool === 'angle') {
      if (!anglePartial) {
        setAnglePartial({ vertex: p, color })
      } else if (!('a' in anglePartial)) {
        setAnglePartial({ vertex: anglePartial.vertex, a: p, color: anglePartial.color })
      } else {
        onCommit({
          id: uid(),
          type: 'angle',
          color: anglePartial.color,
          vertex: anglePartial.vertex,
          a: anglePartial.a,
          b: p,
        })
        setAnglePartial(undefined)
      }
      return
    }

    if (!drawing) return

    switch (drawing.kind) {
      case 'freehand':
        if (drawing.points.length >= 2) {
          onCommit({ id: uid(), type: 'freehand', color: drawing.color, points: drawing.points })
        }
        break
      case 'line':
        if (distance(drawing.a, drawing.b) > 0.01) {
          onCommit({ id: uid(), type: 'line', color: drawing.color, a: drawing.a, b: drawing.b })
        }
        break
      case 'circle':
        if (drawing.radius > 0.01) {
          onCommit({ id: uid(), type: 'circle', color: drawing.color, center: drawing.center, radius: drawing.radius })
        }
        break
    }
    setDrawing(undefined)
  }

  return (
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
      {annotations.map((a) => (
        <AnnotationShape key={a.id} annotation={a} />
      ))}
      {drawing ? <DrawingPreview drawing={drawing} /> : null}
      {anglePartial ? <AnglePartialMarker partial={anglePartial} /> : null}
    </svg>
  )
}

function AnnotationShape({ annotation }: { annotation: Annotation }) {
  const stroke = COLOR_VALUES[annotation.color]
  switch (annotation.type) {
    case 'line':
      return <Line a={annotation.a} b={annotation.b} stroke={stroke} />
    case 'circle':
      return <CircleShape center={annotation.center} radius={annotation.radius} stroke={stroke} />
    case 'freehand':
      return <Path points={annotation.points} stroke={stroke} />
    case 'angle':
      return <AngleShape vertex={annotation.vertex} a={annotation.a} b={annotation.b} stroke={stroke} />
  }
}

function DrawingPreview({ drawing }: { drawing: DragDrawing }) {
  const stroke = COLOR_VALUES[drawing.color]
  switch (drawing.kind) {
    case 'freehand':
      return <Path points={drawing.points} stroke={stroke} />
    case 'line':
      return <Line a={drawing.a} b={drawing.b} stroke={stroke} />
    case 'circle':
      return <CircleShape center={drawing.center} radius={drawing.radius} stroke={stroke} />
  }
}

function AnglePartialMarker({ partial }: { partial: NonNullable<AnglePartial> }) {
  const stroke = COLOR_VALUES[partial.color]
  return (
    <g>
      <circle
        cx={partial.vertex[0] * 1000}
        cy={partial.vertex[1] * 1000}
        r={10}
        fill="none"
        stroke={stroke}
        strokeWidth={3}
        vectorEffect="non-scaling-stroke"
      />
      {'a' in partial ? <Line a={partial.vertex} b={partial.a} stroke={stroke} /> : null}
    </g>
  )
}

function Path({ points, stroke }: { points: Pt[]; stroke: string }) {
  if (points.length < 2) return null
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0] * 1000} ${p[1] * 1000}`)
    .join(' ')
  return <path d={d} stroke={stroke} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" vectorEffect="non-scaling-stroke" />
}

function Line({ a, b, stroke }: { a: Pt; b: Pt; stroke: string }) {
  return (
    <line
      x1={a[0] * 1000}
      y1={a[1] * 1000}
      x2={b[0] * 1000}
      y2={b[1] * 1000}
      stroke={stroke}
      strokeWidth={4}
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
  )
}

function CircleShape({ center, radius, stroke }: { center: Pt; radius: number; stroke: string }) {
  return (
    <circle
      cx={center[0] * 1000}
      cy={center[1] * 1000}
      r={radius * 1000}
      stroke={stroke}
      strokeWidth={4}
      fill="none"
      vectorEffect="non-scaling-stroke"
    />
  )
}

function AngleShape({ vertex, a, b, stroke }: { vertex: Pt; a: Pt; b: Pt; stroke: string }) {
  const deg = angleDegrees(vertex, a, b)
  const dirA = normalize([a[0] - vertex[0], a[1] - vertex[1]])
  const dirB = normalize([b[0] - vertex[0], b[1] - vertex[1]])
  const bis: Pt = normalize([dirA[0] + dirB[0], dirA[1] + dirB[1]])
  const label: Pt = [vertex[0] + bis[0] * 0.08, vertex[1] + bis[1] * 0.08]
  return (
    <g>
      <Line a={vertex} b={a} stroke={stroke} />
      <Line a={vertex} b={b} stroke={stroke} />
      <text
        x={label[0] * 1000}
        y={label[1] * 1000}
        fill={stroke}
        fontSize={32}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="middle"
        paintOrder="stroke"
        stroke="#000"
        strokeWidth={5}
      >
        {Math.round(deg)}°
      </text>
    </g>
  )
}

function clamp01(v: number): number {
  if (v < 0) return 0
  if (v > 1) return 1
  return v
}

function normalize(v: Pt): Pt {
  const len = Math.hypot(v[0], v[1])
  if (len === 0) return [0, 0]
  return [v[0] / len, v[1] / len]
}
