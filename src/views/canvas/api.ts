import request from '@/service/request'
import type { CanvasDetail, CanvasSummary, NodeTemplate, SaveCanvasPayload } from './types'

class CanvasApi {
  static getTemplates() {
    return request.get<NodeTemplate[]>('/canvas/templates')
  }

  static getCanvasList() {
    return request.get<CanvasSummary[]>('/canvas')
  }

  static getCanvasDetail(canvasId: string) {
    return request.get<CanvasDetail>(`/canvas/${canvasId}`)
  }

  static saveCanvas(payload: SaveCanvasPayload) {
    return request.put<CanvasDetail>('/canvas/save', payload)
  }

  static deleteCanvas(canvasId: string) {
    return request.delete<{ deleted: boolean }>(`/canvas/${canvasId}`)
  }
}

export default CanvasApi
