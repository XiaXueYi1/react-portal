import request from '@/service/request'
import type {
  CanvasDetail,
  CanvasListParams,
  CanvasListResponse,
  CanvasSummary,
  NodeTemplate,
  SaveCanvasPayload,
} from './types'

function normalizeCanvasListResponse(
  response: CanvasSummary[] | CanvasListResponse,
  params?: CanvasListParams,
): CanvasListResponse {
  if (Array.isArray(response)) {
    return {
      list: response,
      total: response.length,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? response.length,
    }
  }

  return response
}

class CanvasApi {
  static getTemplates() {
    return request.get<NodeTemplate[]>('/canvas/templates')
  }

  static async getCanvasList(params?: CanvasListParams) {
    const response = await request.get<CanvasSummary[] | CanvasListResponse>('/canvas', { params })
    return normalizeCanvasListResponse(response, params)
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
