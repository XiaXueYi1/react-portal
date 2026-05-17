import request, { resolveApiUrl } from '@/service/request'
import type {
    ConversationDetail,
    ConversationListResponse,
    SendMessagePayload,
} from './types'

// 会话相关 API 封装 —— 列表/详情走 axios，流式走原生 fetch (SSE)
class ChatApi {
    // 获取会话列表（分页）
    static getConversationList(page = 1, pageSize = 30) {
        return request.get<ConversationListResponse>('/chat/conversations', {
            params: { page, pageSize },
        })
    }

    // 获取某个会话的完整消息历史
    static getConversationDetail(conversationId: string) {
        return request.get<ConversationDetail>(`/chat/conversations/${conversationId}`)
    }

    // 删除会话
    static deleteConversation(conversationId: string) {
        return request.delete<{ deleted: boolean }>(`/chat/conversations/${conversationId}`)
    }

    // 手动停止正在生成的回复
    static stopConversation(conversationId: string) {
        return request.post<{ stopped: boolean }>(`/chat/conversations/${conversationId}/stop`)
    }

    // 获取 SSE 流式接口的完整地址
    static getStreamUrl() {
        return resolveApiUrl('/chat/stream')
    }

    // 发起 SSE 流式请求 —— 使用原生 fetch 以便通过 AbortController 取消
    // 返回的 response.body 是一个 ReadableStream，在 useChatStream 中逐块读取
    static async createStreamRequest(payload: SendMessagePayload, signal: AbortSignal) {
        return fetch(ChatApi.getStreamUrl(), {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'text/event-stream',
            },
            body: JSON.stringify(payload),
            signal,
        })
    }
}

export default ChatApi
