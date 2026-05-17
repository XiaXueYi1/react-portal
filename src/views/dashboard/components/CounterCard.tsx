import { useReducer } from 'react'
import { Card, Button, Space, Tag, Statistic } from 'antd'
import { PlusOutlined, MinusOutlined, ReloadOutlined } from '@ant-design/icons'
import { usePrevious } from '@/hooks/usePrevious'

// ---- useReducer 的核心：定义 state 类型和 action 类型 ----
type State = { count: number; lastAction: string }
type Action =
    | { type: 'increment' }
    | { type: 'decrement' }
    | { type: 'reset' }
    | { type: 'add'; payload: number }

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'increment':
            return { count: state.count + 1, lastAction: '+1' }
        case 'decrement':
            return { count: state.count - 1, lastAction: '-1' }
        case 'reset':
            return { count: 0, lastAction: 'reset' }
        case 'add':
            return { count: state.count + action.payload, lastAction: `+${action.payload}` }
    }
}

/**
 * 计数器 —— 演示 useReducer
 * 为什么用 useReducer 而不是 useState？
 *   useState 适合简单的单值状态
 *   useReducer 适合：① 状态逻辑复杂（多种操作）② 下一个状态依赖上一个
 *     ③ 多个子值需要一起更新  ④ 便于测试（reducer 是纯函数）
 */
export default function CounterCard() {
    const [state, dispatch] = useReducer(reducer, { count: 0, lastAction: '-' })
    const prevCount = usePrevious(state.count)

    return (
        <Card title="useReducer 计数器">
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Statistic
                    title="当前值"
                    value={state.count}
                    suffix={
                        <span style={{ fontSize: 14, color: '#999' }}>
                            （上次: {prevCount ?? '-'}）
                        </span>
                    }
                />
                <Tag color="blue">{state.lastAction}</Tag>
            </div>
            <Space>
                <Button icon={<PlusOutlined />} onClick={() => dispatch({ type: 'increment' })}>
                    +1
                </Button>
                <Button icon={<MinusOutlined />} onClick={() => dispatch({ type: 'decrement' })}>
                    -1
                </Button>
                <Button onClick={() => dispatch({ type: 'add', payload: 5 })}>+5</Button>
                <Button
                    icon={<ReloadOutlined />}
                    danger
                    onClick={() => dispatch({ type: 'reset' })}
                >
                    重置
                </Button>
            </Space>
        </Card>
    )
}
