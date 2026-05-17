import type { DragEvent } from 'react'
import type { Node as X6Node } from '@antv/x6'

export type NodeCategory = 'COMMON' | 'VUE' | 'REACT' | 'PROJECT'

export interface NodeTemplate {
  id: string
  name: string
  category: NodeCategory
  description: string
  version?: string
  sortOrder: number
}

export type CanvasFramework = 'vue' | 'react' | null

export interface CanvasSummary {
  id: string
  name: string
  framework: CanvasFramework
  thumbnail?: string | null
  updatedAt: string
  nodeCount: number
}

export interface CanvasListParams {
  page?: number
  pageSize?: number
}

export interface CanvasListResponse {
  list: CanvasSummary[]
  total: number
  page: number
  pageSize: number
}

export interface CanvasDetail {
  id: string
  name: string
  description?: string | null
  framework: CanvasFramework
  thumbnail?: string | null
  isDeleted?: boolean
  createdAt?: string
  updatedAt?: string
  nodes: CanvasNodeData[]
  edges: CanvasEdgeData[]
}

export interface CanvasNodeData {
  id: string
  canvasId?: string
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
  canvasId?: string
  sourceId: string
  targetId: string
  sourcePortId?: string
  targetPortId?: string
  label?: string
  style?: Record<string, unknown> | null
}

export interface SaveCanvasPayload {
  id?: string
  name?: string
  description?: string | null
  framework?: CanvasFramework
  thumbnail?: string | null
  nodes: Array<{
    id: string
    templateId: string
    label: string
    note?: string
    category: NodeCategory
    description?: string
    positionX: number
    positionY: number
  }>
  edges: Array<{
    id: string
    sourceId: string
    targetId: string
    sourcePortId?: string
    targetPortId?: string
    label?: string
    style?: Record<string, unknown> | null
  }>
}

export interface NodeCardProps {
  node?: X6Node
}

export interface X6CanvasHandle {
  loadGraph: (nodes: CanvasNodeData[], edges: CanvasEdgeData[]) => void
  addNode: (data: CanvasNodeData) => void
  removeNode: (id: string) => void
  updateNode: (id: string, patch: Partial<CanvasNodeData>) => void
  getNodeData: (id: string) => CanvasNodeData | undefined
  getAllNodeData: () => CanvasNodeData[]
  addEdge: (data: CanvasEdgeData) => void
  removeEdge: (id: string) => void
  selectNode: (id: string | null) => void
}

export interface X6CanvasProps {
  graphVersion: number
  initialNodes: CanvasNodeData[]
  initialEdges: CanvasEdgeData[]
  onNodeClick: (id: string) => void
  onNodeDoubleClick: (id: string) => void
  onCanvasClick: () => void
  onNodeMove: (id: string, x: number, y: number) => void
  onNodeRemoved: (nodeId: string) => void
  onEdgeCreated: (edge: CanvasEdgeData) => void
  onEdgeRemoved: (edgeId: string) => void
  onDropFromTree: (e: DragEvent) => void
}
