import { DeleteOutlined, EditOutlined, MessageOutlined } from '@ant-design/icons'
import { Conversations } from '@ant-design/x'
import { Button, Empty, Skeleton } from 'antd'
import type { ConversationSidebarProps } from '../types'

// 左侧会话侧边栏
// 三种状态：
//   1. loading → 骨架屏占位
//   2. conversations 为空 → Empty 空态
//   3. 有数据 → Conversations 列表，支持选中、右键删除
function ConversationSidebar({
    loading,
    conversations,
    activeConversationId,
    onSelect,
    onCreate,
    onDelete,
}: ConversationSidebarProps) {
    return (
        <aside className="flex min-h-0 h-full flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-[#fbfcfe] p-4 shadow-[0_20px_80px_rgba(15,23,42,0.06)]">
            {/* 顶部：标题 + 新建按钮 */}
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">History</p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">历史会话</h2>
                </div>
                {/* 点击触发 handleCreateConversation：清空选中 + 标记创建中 */}
                <Button
                    type="primary"
                    shape="circle"
                    icon={<EditOutlined />}
                    className="h-10 w-10 border-0 bg-slate-900 shadow-none hover:!bg-slate-800"
                    onClick={onCreate}
                />
            </div>

            {/* 列表区域 */}
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                {loading ? (
                    // 加载态：5 行骨架屏
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="rounded-[18px] border border-slate-200/70 bg-white p-3">
                                <Skeleton active title={{ width: '56%' }} paragraph={{ rows: 1 }} />
                            </div>
                        ))}
                    </div>
                ) : conversations.length === 0 ? (
                    // 空态
                    <div className="flex h-full items-center justify-center">
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={<span className="text-slate-400">还没有历史会话</span>}
                        />
                    </div>
                ) : (
                    // 会话列表 —— activeKey 控制当前高亮项
                    <Conversations
                        activeKey={activeConversationId ?? undefined}
                        onActiveChange={(value) => onSelect(String(value))}
                        items={conversations.map((conversation) => ({
                            key: conversation.id,
                            icon: <MessageOutlined />,
                            label: (
                                <div className="min-w-0 py-1">
                                    <div className="truncate text-sm font-medium">{conversation.title}</div>
                                    <div className="mt-1 truncate text-xs text-slate-400">
                                        {conversation.lastMessage || '点击继续当前对话'}
                                    </div>
                                </div>
                            ),
                        }))}
                        // 右键菜单：仅"删除会话"
                        menu={(conversation) => ({
                            items: [
                                {
                                    key: 'delete',
                                    icon: <DeleteOutlined />,
                                    danger: true,
                                    label: '删除会话',
                                },
                            ],
                            onClick: ({ key }) => {
                                if (key === 'delete') {
                                    onDelete(String(conversation.key))
                                }
                            },
                        })}
                        className="chat-conversations"
                    />
                )}
            </div>
        </aside>
    )
}

export default ConversationSidebar
