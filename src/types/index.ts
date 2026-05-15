export type Pt = [number, number]

export type AnnotationColor =
  | 'red'
  | 'yellow'
  | 'white'
  | 'cyan'

export type Annotation =
  | { id: string; type: 'line'; color: AnnotationColor; a: Pt; b: Pt }
  | { id: string; type: 'circle'; color: AnnotationColor; center: Pt; radius: number }
  | { id: string; type: 'freehand'; color: AnnotationColor; points: Pt[] }
  | { id: string; type: 'angle'; color: AnnotationColor; vertex: Pt; a: Pt; b: Pt }

export type ToolId = 'line' | 'circle' | 'freehand' | 'angle'

export interface Recording {
  id: string
  name: string
  videoFileName: string
  thumbnailFileName: string
  fps: number
  duration: number
  width: number
  height: number
  createdAt: number
  annotations: Annotation[]
}
