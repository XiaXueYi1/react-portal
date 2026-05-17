import { PauseCircleOutlined, SendOutlined } from '@ant-design/icons'
import { Sender } from '@ant-design/x'
import { Button } from 'antd'
import { useState } from 'react'
import type { ChatComposerProps } from '../types'

// 底部输入区域
// loading 时显示"停止"按钮，否则显示"发送"按钮
// Enter 发送，Shift + Enter 换行
function ChatComposer({ loading, disabled, onSubmit, onStop }: ChatComposerProps) {
    // 输入框内容
    const [value, setValue] = useState('')
    const trimmedValue = value.trim()
    // 发送按钮禁用条件：外部禁用 或 内容为空
    const sendDisabled = Boolean(disabled || !trimmedValue)

    // 发送消息：清空输入框，将内容交给父组件处理
    const handleSend = () => {
        if (sendDisabled) return
        setValue('')
        void onSubmit(trimmedValue)
    }

    return (
        <div className="border-t border-slate-200/80 bg-white px-4 py-4">
            <Sender
                value={value}
                loading={loading}
                disabled={disabled}
                submitType="enter"
                autoSize={{ minRows: 3, maxRows: 8 }}
                placeholder="给 AI 发送消息，Enter 发送，Shift + Enter 换行"
                onChange={(nextValue) => setValue(nextValue)}
                onSubmit={() => handleSend()}
                onCancel={() => void onStop()}
                className="chat-sender"
                // suffix: 右下角按钮 —— 流式中显示"停止"，否则显示"发送"
                suffix={() =>
                    loading ? (
                        <Button
                            icon={<PauseCircleOutlined />}
                            className="chat-composer-action h-10 rounded-full border-0 bg-slate-900 px-4 text-white shadow-none hover:!bg-slate-800 hover:!text-white"
                            onClick={() => void onStop()}
                        >
                            停止
                        </Button>
                    ) : (
                        <Button
                            icon={<SendOutlined />}
                            disabled={sendDisabled}
                            className={`chat-composer-action h-10 rounded-full border-0 px-4 shadow-none ${sendDisabled
                                    ? 'chat-composer-action-disabled bg-slate-200 text-slate-400'
                                    : 'bg-slate-900 text-white hover:!bg-slate-800 hover:!text-white'
                                }`}
                            onClick={handleSend}
                        >
                            发送
                        </Button>
                    )
                }
                footer={false}
                styles={{
                    content: {
                        position: 'relative',
                    },
                    input: {
                        background: '#f8fafc',
                        borderRadius: 22,
                        padding: '18px 112px 18px 18px',
                        minHeight: 112,
                        border: '1px solid rgba(226, 232, 240, 0.9)',
                    },
                    suffix: {
                        position: 'absolute',
                        right: 18,
                        bottom: 18,
                        zIndex: 2,
                        padding: 0,
                        margin: 0,
                    },
                }}
            />
        </div>
    )
}

export default ChatComposer
