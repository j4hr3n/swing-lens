export type Pt = [number, number]

export type AnnotationColor =
  | 'red'
  | 'yellow'
  | 'white'
  | 'cyan'

export type Annotation = {
  id: string
  type: 'line'
  color: AnnotationColor
  a: Pt
  b: Pt
}

export interface Recording {
  id: string
  name: string
  videoFileName: string
  thumbnailFileName?: string
  fps?: number
  duration: number
  width: number
  height: number
  createdAt: number
  annotations: Annotation[]
  pending?: boolean
  failed?: boolean
}
