import { RobotOutlined, UserOutlined } from '@ant-design/icons'
import { Bubble, Welcome } from '@ant-design/x'
import { XMarkdown } from '@ant-design/x-markdown'
import { Avatar, Spin, Tag } from 'antd'
import { useLayoutEffect, useRef } from 'react'
import type { ChatMessageListProps } from '../types'

// 消息列表区域（右侧主体）
// 三种状态：
//   1. loading → 居中 Spin
//   2. messages 为空 → Welcome 引导页
//   3. 有消息 → Bubble.List + 滚动容器
function ChatMessageList({ loading, messages, isStreaming }: ChatMessageListProps) {
    // 滚动容器的 ref，用于新消息到来时自动滚到底部
    const containerRef = useRef<HTMLDivElement>(null)

    // 每当消息变化或流式有新内容时，自动滚到底部
    // useLayoutEffect 确保 DOM 提交后同步执行，避免 loading 态切换时 ref 为 null
    // requestAnimationFrame 等 Bubble.List 异步子节点渲染完成后再取 scrollHeight
    useLayoutEffect(() => {
        const element = containerRef.current
        if (!element) return
        requestAnimationFrame(() => {
            element.scrollTop = element.scrollHeight
        })
    }, [messages, isStreaming])

    // 状态 1：正在加载历史消息
    if (loading) {
        return (
            <div className="flex min-h-0 flex-1 items-center justify-center bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
                <Spin size="large" />
            </div>
        )
    }

    // 状态 2：空消息（新会话 或 选中会话无消息）
    if (messages.length === 0) {
        return (
            <div className="flex min-h-0 flex-1 items-center justify-center bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 sm:p-6">
                <div className="w-full max-w-2xl">
                    <Welcome
                        variant="borderless"
                        icon={<Avatar size={56} icon={<RobotOutlined />} className="bg-slate-900" />}
                        title="开始一段新的对话"
                        description="左侧保留历史会话，右侧专注当前聊天。发送第一条消息后会自动创建会话并持续返回流式内容。"
                        classNames={{
                            title: 'text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl',
                            description: 'max-w-xl text-sm leading-7 text-slate-500 sm:text-base sm:leading-8',
                        }}
                    />
                </div>
            </div>
        )
    }

    // 状态 3：渲染消息列表
    return (
        <div
            ref={containerRef}
            className="chat-message-scroll min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-3 py-4 sm:px-4 sm:py-6 md:px-6"
        >
            <div className="flex w-full flex-col gap-7 pb-3">
                <Bubble.List
                    items={messages.map((message) => ({
                        key: message.id,
                        // 角色映射：assistant → AI 气泡（左侧），user → 本地气泡（右侧）
                        role: message.role === 'assistant' ? 'ai' : 'local',
                        placement: message.role === 'assistant' ? 'start' : 'end',
                        content: (
                            <div className="space-y-2">
                                {message.content ? (
                                    <XMarkdown
                                        content={message.content}
                                        // hasNextChunk: 流式进行中时开启闪烁光标动画
                                        streaming={{
                                            hasNextChunk: message.status === 'generating',
                                        }}
                                        openLinksInNewTab
                                        className="text-[15px] leading-7"
                                    />
                                ) : message.status === 'generating' ? (
                                    <p className="text-[15px] leading-7">正在思考...</p>
                                ) : null}
                                <div className="flex items-center gap-2 text-[11px] text-current/45">
                                    <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                                    {message.status !== 'done' && (
                                        <Tag
                                            bordered={false}
                                            color={message.status === 'error' ? 'error' : 'processing'}
                                            className="rounded-full"
                                        >
                                            {message.status === 'generating'
                                                ? '生成中'
                                                : message.status === 'stopped'
                                                    ? '已停止'
                                                    : '异常'}
                                        </Tag>
                                    )}
                                    {message.totalTokens > 0 && <span>{message.totalTokens} tokens</span>}
                                </div>
                            </div>
                        ),
                        avatar:
                            message.role === 'assistant' ? (
                                <Avatar size={38} icon={<RobotOutlined />} className="bg-slate-900" />
                            ) : (
                                <Avatar size={38} icon={<UserOutlined />} className="bg-slate-200 text-slate-700" />
                            ),
                        // typing: 空内容 + 生成中 → 显示打字动画
                        typing: message.status === 'generating' && !message.content,
                        style: {
                            maxWidth: 'min(92%, 960px)',
                        },
                    }))}
                    style={{ background: 'transparent', width: '100%' }}
                    className="chat-bubble-list"
                />

                {isStreaming && (
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                        <Spin size="small" />
                        <span>AI 正在生成回复...</span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ChatMessageList
