export type NodeCategory = 'COMMON' | 'VUE' | 'REACT' | 'PROJECT'

export interface NodeTemplate {
  id: string
  name: string
  category: NodeCategory
  description: string
  version?: string
  sortOrder: number
}

export interface CanvasNodeData {
  id: string
  templateId: string
  label: string
  category: NodeCategory
  description: string
  note: string
  positionX: number
  positionY: number
}

export interface DragNodeData {
  title: string
  key: string
  category: NodeCategory
}

export interface CanvasEdgeData {
  id: string
  sourceId: string
  targetId: string
  label?: string
}
