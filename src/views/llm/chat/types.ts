// 消息角色：用户 / 助手 / 系统 / 工具调用
export type ChatMessageRole = 'user' | 'assistant' | 'system' | 'tool'

// 消息状态：流式生成中 / 完成 / 异常 / 用户手动停止
export type ChatMessageStatus = 'generating' | 'done' | 'error' | 'stopped'

// 侧边栏会话列表项（来自 GET /chat/conversations 的摘要数据）
export interface ConversationSummary {
    id: string
    agentKey: string
    title: string
    model: string
    messageCount: number
    lastMessage: string | null
    createdAt: string
    updatedAt: string
}

// 单条消息（来自 GET /chat/conversations/:id 的详情）
export interface ConversationMessage {
    id: string
    conversationId: string
    parentId: string | null
    role: ChatMessageRole
    content: string
    status: ChatMessageStatus
    seq: number
    model: string | null
    promptTokens: number
    completionTokens: number
    totalTokens: number
    createdAt: string
}

// 会话详情（含完整消息列表）
export interface ConversationDetail {
    id: string
    agentKey: string
    title: string
    model: string
    messages: ConversationMessage[]
    createdAt: string
    updatedAt: string
}

// GET /chat/conversations 分页响应
export interface ConversationListResponse {
    list: ConversationSummary[]
    total: number
    page: number
    pageSize: number
}

// POST /chat/stream 请求体 —— 不传 conversationId 时后端会自动创建新会话
export interface SendMessagePayload {
    conversationId?: string
    agentKey?: string
    model?: string
    message: string
}

// ========== SSE 流式事件的四种类型 ==========

// 后端确认会话已创建/找到，返回真实的 conversationId 及首对消息 ID
export interface StreamConversationEvent {
    type: 'conversation'
    conversationId: string
    userMessageId: string
    assistantMessageId: string
}

// 流式增量文本
export interface StreamDeltaEvent {
    type: 'delta'
    conversationId: string
    assistantMessageId: string
    content: string
}

// 流式结束，附带完整内容及 token 用量
export interface StreamDoneEvent {
    type: 'done'
    conversationId: string
    assistantMessageId: string
    content: string
    usage?: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
    }
}

// 流式异常
export interface StreamErrorEvent {
    type: 'error'
    conversationId?: string
    assistantMessageId?: string
    message: string
}

export type ChatStreamEvent =
    | StreamConversationEvent
    | StreamDeltaEvent
    | StreamDoneEvent
    | StreamErrorEvent

// 前端消息模型 —— 在服务端消息基础上增加 isOptimistic 标记
// isOptimistic: true → 前端乐观插入的占位消息，还没拿到服务端回传的真实 ID
export interface ClientConversationMessage extends ConversationMessage {
    isOptimistic?: boolean
}

// ========== 组件 Props ==========

export interface ChatComposerProps {
    loading: boolean           // 是否正在流式中，控制按钮切换为"停止"
    disabled?: boolean
    onSubmit: (message: string) => Promise<void> | void
    onStop: () => Promise<void> | void
}

export interface ChatMessageListProps {
    loading: boolean           // 正在加载历史消息详情
    messages: ClientConversationMessage[]
    isStreaming: boolean       // 正在接收流式内容，底部显示动画
}

export interface ConversationSidebarProps {
    loading: boolean           // 正在加载会话列表
    conversations: ConversationSummary[]
    activeConversationId: string | null
    onSelect: (conversationId: string) => void   // 切换选中会话
    onCreate: () => void                          // 点击"新建会话"按钮
    onDelete: (conversationId: string) => void    // 右键删除会话
}

export interface UseChatStreamOptions {
    onEvent: (event: ChatStreamEvent) => void     // SSE 事件回调
}
