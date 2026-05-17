import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react'
import { message } from 'antd'
import ChatApi from './api'
import ChatComposer from './components/ChatComposer'
import ChatMessageList from './components/ChatMessageList'
import ConversationSidebar from './components/ConversationSidebar'
import { CHAT_MODEL, DRAFT_PREFIX } from './constants'
import useChatStream from './hooks/useChatStream'
import type {
    ChatStreamEvent,
    ClientConversationMessage,
    ConversationDetail,
    ConversationSummary,
} from './types'

// 流式请求期间的临时上下文
// 核心作用：在 SSE 事件回调中定位"正在操作的是哪个会话、哪两条消息"
// 因为事件回调是异步的，不能用 state（闭包陈旧问题），所以用 ref
interface PendingStreamContext {
    draftConversationId: string       // 临时 draft ID（新会话）或真实 ID（已有会话）
    currentConversationId: string     // 收到 conversation 事件后更新为真实 ID
    userDraftMessageId: string        // 乐观插入的用户消息临时 ID
    assistantDraftMessageId: string   // 乐观插入的 AI 消息临时 ID
    userMessageId?: string            // 服务端回传的用户消息真实 ID
    assistantMessageId?: string       // 服务端回传的 AI 消息真实 ID
}

// 判断是否为临时会话 ID（以 "draft-" 开头）
function isDraftConversationId(value: string | null): value is string {
    return Boolean(value?.startsWith(DRAFT_PREFIX))
}

// 将服务端返回的 ConversationDetail 转成前端消息格式
function toClientMessages(detail: ConversationDetail): ClientConversationMessage[] {
    return detail.messages.map((messageItem) => ({
        ...messageItem,
        createdAt: messageItem.createdAt,
    }))
}

function Chat() {
    // ==================== 核心状态 ====================

    // 左侧会话列表
    const [conversations, setConversations] = useState<ConversationSummary[]>([])
    // 当前选中的会话 ID —— null 时显示 Welcome 引导页
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
    // 是否处于"新建会话"模式（点击了 + 按钮但还没发消息）
    const [isCreatingConversation, setIsCreatingConversation] = useState(false)
    // 消息缓存：key = conversationId → 该会话的消息列表
    // 独立于 conversations 列表，支持按需加载和乐观更新
    const [messagesMap, setMessagesMap] = useState<Record<string, ClientConversationMessage[]>>({})
    // 侧边栏加载态
    const [loadingConversations, setLoadingConversations] = useState(false)
    // 消息详情加载态
    const [loadingDetail, setLoadingDetail] = useState(false)

    // 流式上下文 ref —— 解决闭包陈旧问题（详见 PendingStreamContext 注释）
    const pendingStreamRef = useRef<PendingStreamContext | null>(null)

    // ==================== 派生状态 ====================

    // 当前会话的消息列表
    // isCreatingConversation 时返回空 → Welcome 页；无选中 → 空；否则取缓存
    const activeMessages = useMemo(() => {
        if (isCreatingConversation || !activeConversationId) {
            return []
        }
        return messagesMap[activeConversationId] ?? []
    }, [activeConversationId, isCreatingConversation, messagesMap])

    // ==================== 工具方法 ====================

    // 将一条会话摘要插入列表最前面（去重后）
    const upsertConversationSummary = useCallback((conversation: ConversationSummary) => {
        setConversations((prev) => {
            const next = prev.filter((item) => item.id !== conversation.id)
            return [conversation, ...next]
        })
    }, [])

    // 将临时 draft ID 替换为服务端返回的真实 ID
    // 同时更新 messagesMap、conversations、activeConversationId 三处的 key
    const replaceConversationKey = useCallback((fromId: string, toId: string) => {
        if (fromId === toId) return

        // 替换 messagesMap 中的 key
        setMessagesMap((prev) => {
            const sourceMessages = prev[fromId] ?? []
            const next = { ...prev, [toId]: sourceMessages.map((item) => ({ ...item, conversationId: toId })) }
            delete next[fromId]
            return next
        })

        // 替换 conversations 中的 id
        setConversations((prev) =>
            prev.map((item) => (item.id === fromId ? { ...item, id: toId } : item)),
        )

        // 替换 activeConversationId
        setActiveConversationId((prev) => (prev === fromId ? toId : prev))
        // key 替换完成，退出创建模式
        setIsCreatingConversation(false)
    }, [])

    // 标记某条消息的状态（generating → done/error/stopped）
    const markMessageStatus = useCallback(
        (conversationId: string, messageId: string, status: ClientConversationMessage['status']) => {
            setMessagesMap((prev) => ({
                ...prev,
                [conversationId]: (prev[conversationId] ?? []).map((item) =>
                    item.id === messageId ? { ...item, status } : item,
                ),
            }))
        },
        [],
    )

    // ==================== 数据加载 ====================

    // 加载侧边栏会话列表
    // preferredConversationId: 加载完成后优先定位到该会话（流式结束后刷新用）
    const loadConversations = useCallback(
        async (preferredConversationId?: string | null) => {
            setLoadingConversations(true)
            try {
                const response = await ChatApi.getConversationList()
                const list = response.list
                setConversations(list)

                // 确定加载完成后应该选中哪个会话
                // 优先级：preferredConversationId > 保留当前创建模式 > 保留已有选中 > 第一个
                startTransition(() => {
                    if (preferredConversationId && list.some((item) => item.id === preferredConversationId)) {
                        setActiveConversationId(preferredConversationId)
                        setIsCreatingConversation(false)
                        return
                    }

                    if (isCreatingConversation) {
                        return
                    }

                    if (activeConversationId && list.some((item) => item.id === activeConversationId)) {
                        return
                    }

                    setActiveConversationId(list[0]?.id ?? null)
                })
            } catch (error) {
                message.error(error instanceof Error ? error.message : '加载历史会话失败')
            } finally {
                setLoadingConversations(false)
            }
        },
        [activeConversationId, isCreatingConversation],
    )

    // 加载某个会话的消息详情（首次点击时按需加载，之后走 messagesMap 缓存）
    const loadConversationDetail = useCallback(
        async (conversationId: string) => {
            // draft ID 是前端的临时占位，不需要请求后端
            if (isDraftConversationId(conversationId)) return

            setLoadingDetail(true)
            try {
                const detail = await ChatApi.getConversationDetail(conversationId)
                // 写入消息缓存
                setMessagesMap((prev) => ({
                    ...prev,
                    [conversationId]: toClientMessages(detail),
                }))
                // 同时更新侧边栏摘要（消息数、最后一条消息等可能已变化）
                upsertConversationSummary({
                    id: detail.id,
                    agentKey: detail.agentKey,
                    title: detail.title,
                    model: detail.model,
                    messageCount: detail.messages.length,
                    lastMessage: detail.messages.at(-1)?.content ?? null,
                    createdAt: detail.createdAt,
                    updatedAt: detail.updatedAt,
                })
            } catch (error) {
                message.error(error instanceof Error ? error.message : '加载会话详情失败')
            } finally {
                setLoadingDetail(false)
            }
        },
        [upsertConversationSummary],
    )

    // 流式结束后刷新：重新拉列表 + 重新拉详情（拿到服务端最终态）
    const refreshAfterStream = useCallback(
        async (conversationId: string) => {
            await Promise.all([loadConversations(conversationId), loadConversationDetail(conversationId)])
        },
        [loadConversationDetail, loadConversations],
    )

    // ==================== SSE 事件处理 ====================

    // 这是整条流式链路的核心回调，处理四种事件：
    //   conversation → 服务端确认会话创建，返回真实 ID
    //   delta       → 流式增量文本
    //   done        → 流式结束，刷新数据
    //   error       → 异常处理
    const handleStreamEvent = useCallback(
        (event: ChatStreamEvent) => {
            const context = pendingStreamRef.current
            if (!context) {
                // 无上下文（已停止或异常清理后），只弹出错误提示
                if (event.type === 'error') {
                    message.error(event.message)
                }
                return
            }

            // ---- conversation 事件：后端的第一个响应 ----
            // 将前端 draft ID 替换为真实 conversationId + 消息 ID
            if (event.type === 'conversation') {
                replaceConversationKey(context.draftConversationId, event.conversationId)
                // 更新上下文，后续 delta/done/error 都用真实 ID 定位
                context.currentConversationId = event.conversationId
                context.userMessageId = event.userMessageId
                context.assistantMessageId = event.assistantMessageId

                // 将乐观消息的 ID 从临时值替换为服务端返回值
                setMessagesMap((prev) => ({
                    ...prev,
                    [event.conversationId]: (prev[event.conversationId] ?? []).map((item) => {
                        if (item.id === context.userDraftMessageId) {
                            return {
                                ...item,
                                id: event.userMessageId,
                                conversationId: event.conversationId,
                                isOptimistic: false,
                            }
                        }
                        if (item.id === context.assistantDraftMessageId) {
                            return {
                                ...item,
                                id: event.assistantMessageId,
                                conversationId: event.conversationId,
                                isOptimistic: false,
                            }
                        }
                        return item
                    }),
                }))

                return
            }

            // ---- delta 事件：流式增量 ----
            // 将增量文本拼接到 AI 消息的 content 末尾
            if (event.type === 'delta') {
                const conversationId = context.currentConversationId
                // 优先用真实 ID，fallback 到 draft ID（极端情况：delta 先于 conversation 到达）
                const assistantId = context.assistantMessageId ?? context.assistantDraftMessageId

                setMessagesMap((prev) => ({
                    ...prev,
                    [conversationId]: (prev[conversationId] ?? []).map((item) =>
                        item.id === assistantId
                            ? {
                                ...item,
                                content: `${item.content}${event.content}`,
                                status: 'generating',
                            }
                            : item,
                    ),
                }))
                return
            }

            // ---- done 事件：流式正常结束 ----
            // 用服务端返回的完整内容覆盖（兜底），并记录 token 用量
            if (event.type === 'done') {
                const conversationId = context.currentConversationId
                const assistantId = context.assistantMessageId ?? context.assistantDraftMessageId

                setMessagesMap((prev) => ({
                    ...prev,
                    [conversationId]: (prev[conversationId] ?? []).map((item) =>
                        item.id === assistantId
                            ? {
                                ...item,
                                content: event.content,
                                status: 'done',
                                totalTokens: event.usage?.total_tokens ?? item.totalTokens,
                                promptTokens: event.usage?.prompt_tokens ?? item.promptTokens,
                                completionTokens: event.usage?.completion_tokens ?? item.completionTokens,
                                isOptimistic: false,
                            }
                            : item,
                    ),
                }))

                // 刷新侧边栏和消息详情（获取服务端最终态）
                void refreshAfterStream(conversationId)
                // 清理上下文，流式周期结束
                pendingStreamRef.current = null
                return
            }

            // ---- error 事件：流式异常 ----
            if (event.type === 'error') {
                const conversationId = context.currentConversationId
                const assistantId = context.assistantMessageId ?? context.assistantDraftMessageId
                markMessageStatus(conversationId, assistantId, 'error')
                pendingStreamRef.current = null
                message.error(event.message)
            }
        },
        [markMessageStatus, refreshAfterStream, replaceConversationKey],
    )

    // useChatStream: 管理 SSE 连接生命周期
    //   isStreaming → 外传给 ChatComposer/MessageList 控制 UI
    //   startStream → 发送消息时调用
    //   stopStream  → 用户点停止或切换会话时调用
    const { isStreaming, startStream, stopStream } = useChatStream({ onEvent: handleStreamEvent })

    // ==================== 副作用 ====================

    // 初始化：加载会话列表
    useEffect(() => {
        void loadConversations()
    }, [])

    // 选中会话变化时，按需加载消息详情
    // 跳过条件：创建模式 / 无选中 / 已缓存 / draft ID
    useEffect(() => {
        if (
            isCreatingConversation ||
            !activeConversationId ||
            messagesMap[activeConversationId] ||
            isDraftConversationId(activeConversationId)
        ) {
            return
        }
        void loadConversationDetail(activeConversationId)
    }, [activeConversationId, isCreatingConversation, loadConversationDetail, messagesMap])

    // ==================== 用户操作 ====================

    // 点击侧边栏某个会话 → 切换到该会话
    const handleSelectConversation = useCallback((conversationId: string) => {
        setIsCreatingConversation(false)
        // startTransition: 低优先级更新，避免切换时卡顿
        startTransition(() => setActiveConversationId(conversationId))
    }, [])

    // 点击 + 按钮 → 进入"新建会话"模式
    // 注意：此时不做任何 API 调用，只是清空选中 + 标记状态
    // 真正的会话创建发生在用户发送第一条消息时（后端看到无 conversationId 即创建）
    const handleCreateConversation = useCallback(() => {
        setIsCreatingConversation(true)
        setActiveConversationId(null)
    }, [])

    // 右键删除会话
    const handleDeleteConversation = useCallback(async (conversationId: string) => {
        try {
            // draft 会话没在后端存在，跳过 API 调用
            if (!isDraftConversationId(conversationId)) {
                await ChatApi.deleteConversation(conversationId)
            }

            // 从列表和缓存中移除
            setConversations((prev) => prev.filter((item) => item.id !== conversationId))
            setMessagesMap((prev) => {
                const next = { ...prev }
                delete next[conversationId]
                return next
            })
            // 如果删除的是当前选中的，置空选中
            setActiveConversationId((prev) => (prev === conversationId ? null : prev))
            setIsCreatingConversation((prev) => (prev ? true : false))
            message.success('会话已删除')
        } catch (error) {
            message.error(error instanceof Error ? error.message : '删除会话失败')
        }
    }, [])

    // 发送消息 —— 整个应用最核心的流程
    const handleSendMessage = useCallback(
        async (content: string) => {
            const now = new Date().toISOString()

            // 判断当前是否有"真实"的会话：非创建模式 + 有选中 + 非 draft
            // 如果没有 → currentConversationId 为 undefined → 后端会创建新会话
            const currentConversationId =
                !isCreatingConversation && activeConversationId && !isDraftConversationId(activeConversationId)
                    ? activeConversationId
                    : undefined

            // 生成临时 ID：要么复用已有会话 ID，要么生成新的 draft ID
            const draftConversationId = currentConversationId ?? `${DRAFT_PREFIX}${Date.now()}`
            const userDraftMessageId = `user-${Date.now()}`
            const assistantDraftMessageId = `assistant-${Date.now()}`

            // 构建乐观用户消息（立即显示，不等后端响应）
            const optimisticUserMessage: ClientConversationMessage = {
                id: userDraftMessageId,
                conversationId: draftConversationId,
                parentId: null,
                role: 'user',
                content,
                status: 'done',
                seq: (messagesMap[draftConversationId]?.length ?? 0) + 1,
                model: CHAT_MODEL,
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
                createdAt: now,
                isOptimistic: true,
            }

            // 构建乐观 AI 消息（空内容 + generating 状态，显示"正在思考..."）
            const optimisticAssistantMessage: ClientConversationMessage = {
                id: assistantDraftMessageId,
                conversationId: draftConversationId,
                parentId: userDraftMessageId,
                role: 'assistant',
                content: '',
                status: 'generating',
                seq: optimisticUserMessage.seq + 1,
                model: CHAT_MODEL,
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
                createdAt: now,
                isOptimistic: true,
            }

            // 新会话：同步在侧边栏插入一条临时摘要项
            if (!currentConversationId) {
                upsertConversationSummary({
                    id: draftConversationId,
                    agentKey: 'default',
                    title: content.slice(0, 24),
                    model: CHAT_MODEL,
                    messageCount: 2,
                    lastMessage: content,
                    createdAt: now,
                    updatedAt: now,
                })
            }

            // 写入乐观消息到缓存
            setMessagesMap((prev) => ({
                ...prev,
                [draftConversationId]: [
                    ...(prev[draftConversationId] ?? []),
                    optimisticUserMessage,
                    optimisticAssistantMessage,
                ],
            }))
            // 切换到当前操作的会话
            setActiveConversationId(draftConversationId)
            setIsCreatingConversation(false)

            // 保存上下文供 SSE 事件回调使用
            pendingStreamRef.current = {
                draftConversationId,
                currentConversationId: draftConversationId,
                userDraftMessageId,
                assistantDraftMessageId,
            }

            // 发起 SSE 流式请求 —— 不传 conversationId 时后端创建新会话
            await startStream({
                conversationId: currentConversationId,
                model: CHAT_MODEL,
                message: content,
            })
        },
        [activeConversationId, isCreatingConversation, messagesMap, startStream, upsertConversationSummary],
    )

    // 用户点击"停止"按钮
    const handleStop = useCallback(async () => {
        const context = pendingStreamRef.current
        // 前端中止流式连接
        stopStream()

        if (!context) return

        const conversationId = context.currentConversationId
        const assistantId = context.assistantMessageId ?? context.assistantDraftMessageId
        // 标记 AI 消息为 stopped 状态
        markMessageStatus(conversationId, assistantId, 'stopped')

        // 已落地的真实会话 → 通知后端停止生成
        if (!isDraftConversationId(conversationId)) {
            try {
                await ChatApi.stopConversation(conversationId)
            } catch {
                // ignore
            }
        }

        pendingStreamRef.current = null
    }, [markMessageStatus, stopStream])

    // 当前选中的会话摘要（用于顶部标题显示）
    const activeConversation = useMemo(() => {
        if (isCreatingConversation) {
            return null
        }
        return conversations.find((item) => item.id === activeConversationId) ?? null
    }, [activeConversationId, conversations, isCreatingConversation])

    // ==================== 渲染 ====================

    return (
        <div className="chat-shell flex-1 overflow-auto min-h-0 p-4 md:p-5">
            <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
                {/* 左侧：会话侧边栏 */}
                <ConversationSidebar
                    loading={loadingConversations}
                    conversations={conversations}
                    // isCreatingConversation 时强制传 null → 侧边栏取消所有高亮
                    activeConversationId={isCreatingConversation ? null : activeConversationId}
                    onCreate={handleCreateConversation}
                    onSelect={handleSelectConversation}
                    onDelete={(conversationId) => void handleDeleteConversation(conversationId)}
                />

                {/* 右侧：对话主体 */}
                <section className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
                    {/* 顶部标题栏 */}
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 px-6 py-4">
                        <div className="min-w-0">
                            <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-slate-400">
                                Conversation
                            </p>
                            <h1 className="mt-2 truncate text-lg font-semibold text-slate-950">
                                {activeConversation?.title || '新会话'}
                            </h1>
                        </div>
                        <div className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                            {activeMessages.length} 条消息
                        </div>
                    </div>

                    {/* 消息列表 */}
                    <ChatMessageList
                        loading={loadingDetail && activeMessages.length === 0}
                        messages={activeMessages}
                        isStreaming={isStreaming}
                    />

                    {/* 底部输入区 */}
                    <ChatComposer
                        loading={isStreaming}
                        onSubmit={handleSendMessage}
                        onStop={handleStop}
                    />
                </section>
            </div>
        </div>
    )
}

export default Chat
