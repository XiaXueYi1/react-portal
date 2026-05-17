import { useCallback, useRef, useState } from 'react'
import ChatApi from '../api'
import type { ChatStreamEvent, SendMessagePayload, UseChatStreamOptions } from '../types'

// SSE 流式通信 Hook
// 核心职责：发起 fetch → 逐块读取 ReadableStream → 解析 SSE data → 回调 onEvent
// 返回值 isStreaming 控制 UI 状态，stopStream 通过 AbortController 中断请求
function useChatStream({ onEvent }: UseChatStreamOptions) {
    // 是否正在流式接收中
    const [isStreaming, setIsStreaming] = useState(false)
    // 保存当前请求的 AbortController，用于取消请求
    const controllerRef = useRef<AbortController | null>(null)

    // 停止流式 —— 调用 abort() 触发 fetch 抛出 AbortError
    const stopStream = useCallback(() => {
        controllerRef.current?.abort()
        controllerRef.current = null
        setIsStreaming(false)
    }, [])

    // 开始流式 —— 发起 POST /chat/stream，循环读取 SSE 事件
    const startStream = useCallback(
        async (payload: SendMessagePayload) => {
            // 先中止上一次未完成的请求，避免并发
            controllerRef.current?.abort()
            const controller = new AbortController()
            controllerRef.current = controller
            setIsStreaming(true)

            try {
                const response = await ChatApi.createStreamRequest(payload, controller.signal)
                if (!response.ok || !response.body) {
                    throw new Error(`流式请求失败: ${response.status}`)
                }

                const reader = response.body.getReader()
                const decoder = new TextDecoder('utf-8')
                // buffer 用于拼接跨 chunk 的不完整 SSE 帧
                let buffer = ''

                while (true) {
                    const { value, done } = await reader.read()
                    if (done) break

                    buffer += decoder.decode(value, { stream: true })
                    // SSE 事件以 \n\n 分隔，最后一个可能不完整，用 pop 保留到下次
                    const chunks = buffer.split('\n\n')
                    buffer = chunks.pop() ?? ''

                    for (const chunk of chunks) {
                        const lines = chunk
                            .split('\n')
                            .map((line) => line.trim())
                            .filter((line) => line.startsWith('data:'))

                        for (const line of lines) {
                            // 去掉 "data:" 前缀，取 JSON 负载
                            const raw = line.slice(5).trim()
                            // [DONE] 是 SSE 标准结束标记
                            if (!raw || raw === '[DONE]') continue

                            const event = JSON.parse(raw) as ChatStreamEvent
                            onEvent(event)
                        }
                    }
                }
            } catch (error) {
                // 只有非主动取消的错误才上报 —— abort 导致的错误直接忽略
                if (!controller.signal.aborted) {
                    onEvent({
                        type: 'error',
                        message: error instanceof Error ? error.message : '流式输出失败',
                    })
                }
            } finally {
                // 只有当前 controller 还在 ref 中时才清理，防止覆盖新请求
                if (controllerRef.current === controller) {
                    controllerRef.current = null
                }
                setIsStreaming(false)
            }
        },
        [onEvent],
    )

    return {
        isStreaming,
        startStream,
        stopStream,
    }
}

export default useChatStream
