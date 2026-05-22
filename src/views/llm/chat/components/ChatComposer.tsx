import { PauseCircleOutlined, SendOutlined } from '@ant-design/icons'
import { Sender } from '@ant-design/x'
import { Button } from 'antd'
import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { ChatComposerProps } from '../types'

function ChatComposer({ loading, disabled, onSubmit, onStop }: ChatComposerProps) {
    const [value, setValue] = useState('')
    const trimmedValue = value.trim()
    const sendDisabled = Boolean(disabled || !trimmedValue)

    const handleSend = () => {
        if (sendDisabled) return
        setValue('')
        void onSubmit(trimmedValue)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
        const isModifierPressed = event.metaKey || event.ctrlKey || event.altKey
        if (event.key !== 'Enter' || event.shiftKey || isModifierPressed || event.nativeEvent.isComposing) {
            return
        }

        event.preventDefault()
        handleSend()
        return false
    }

    return (
        <div className="border-t border-slate-200/80 bg-white px-3 py-3 sm:px-4 sm:py-4">
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
                onKeyDown={handleKeyDown}
                className="chat-sender"
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
                            aria-label="发送"
                            disabled={sendDisabled}
                            className={`chat-composer-action h-11 w-11 rounded-full border-0 p-0 shadow-none ${sendDisabled
                                ? 'chat-composer-action-disabled bg-slate-200 text-slate-400'
                                : 'bg-slate-900 text-white hover:!bg-slate-800 hover:!text-white'
                                }`}
                            onClick={handleSend}
                        />
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
                        padding: '16px 78px 16px 16px',
                        minHeight: 96,
                        border: '1px solid rgba(226, 232, 240, 0.9)',
                    },
                    suffix: {
                        position: 'absolute',
                        right: 16,
                        bottom: 16,
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
