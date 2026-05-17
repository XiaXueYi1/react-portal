import { useReducer, useMemo, useCallback, useRef } from 'react'
import type { InputRef } from 'antd'
import { Card, Input, Button, List, Checkbox, Tag, Space, Select, Badge, Popconfirm } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'

// ---- useReducer: 管理复杂的列表状态 ----
type Todo = { id: number; text: string; done: boolean }
type FilterType = 'all' | 'done' | 'todo'

type State = {
    todos: Todo[]
    filter: FilterType
    nextId: number
}

type Action =
    | { type: 'add'; text: string }
    | { type: 'toggle'; id: number }
    | { type: 'remove'; id: number }
    | { type: 'setFilter'; filter: FilterType }

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'add':
            return {
                ...state,
                todos: [...state.todos, { id: state.nextId, text: action.text, done: false }],
                nextId: state.nextId + 1,
            }
        case 'toggle':
            return {
                ...state,
                todos: state.todos.map(t =>
                    t.id === action.id ? { ...t, done: !t.done } : t
                ),
            }
        case 'remove':
            return {
                ...state,
                todos: state.todos.filter(t => t.id !== action.id),
            }
        case 'setFilter':
            return { ...state, filter: action.filter }
    }
}

export default function TodoList() {
    const [state, dispatch] = useReducer(reducer, {
        todos: [
            { id: 1, text: '学习 useReducer', done: true },
            { id: 2, text: '学习 useMemo', done: false },
            { id: 3, text: '学习 useCallback', done: false },
        ],
        filter: 'all' as FilterType,
        nextId: 4,
    })

    // useRef —— 拿到 Input 的 DOM 引用，提交后自动聚焦
    const inputRef = useRef<InputRef>(null)

    // useMemo —— filter 变化时重新计算，todos 不变时就用缓存值，避免重复遍历
    const filteredTodos = useMemo(() => {
        console.log('useMemo 计算中... filter:', state.filter)
        switch (state.filter) {
            case 'done':
                return state.todos.filter(t => t.done)
            case 'todo':
                return state.todos.filter(t => !t.done)
            default:
                return state.todos
        }
    }, [state.todos, state.filter])

    const doneCount = useMemo(
        () => state.todos.filter(t => t.done).length,
        [state.todos]
    )

    // useCallback —— 保持函数引用不变，不会导致子组件不必要的重渲染
    const handleAdd = useCallback(() => {
        const text = inputRef.current?.input?.value.trim()
        if (!text) return
        dispatch({ type: 'add', text })
        if (inputRef.current?.input) {
            inputRef.current.input.value = ''
        }
        inputRef.current?.focus()
    }, [])

    const handleToggle = useCallback((id: number) => {
        dispatch({ type: 'toggle', id })
    }, [])

    const handleRemove = useCallback((id: number) => {
        dispatch({ type: 'remove', id })
    }, [])

    return (
        <Card
            title={
                <Space>
                    <span>Todo List (useReducer + useMemo + useCallback)</span>
                    <Badge count={state.todos.length - doneCount} overflowCount={99}>
                        <Tag color="processing">待办</Tag>
                    </Badge>
                </Space>
            }
        >
            {/* 输入区域 */}
            <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
                <Input ref={inputRef} placeholder="输入待办事项..." onPressEnter={handleAdd} />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                    添加
                </Button>
            </Space.Compact>

            {/* 筛选 */}
            <Select
                value={state.filter}
                onChange={(v: FilterType) => dispatch({ type: 'setFilter', filter: v })}
                style={{ width: 120, marginBottom: 16 }}
                options={[
                    { value: 'all', label: `全部 (${state.todos.length})` },
                    { value: 'todo', label: `未完成 (${state.todos.length - doneCount})` },
                    { value: 'done', label: `已完成 (${doneCount})` },
                ]}
            />

            {/* 列表 */}
            <List
                dataSource={filteredTodos}
                locale={{ emptyText: '暂无数据' }}
                renderItem={todo => (
                    <List.Item
                        actions={[
                            <Popconfirm
                                key="del"
                                title="确定删除？"
                                onConfirm={() => handleRemove(todo.id)}
                            >
                                <Button size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>,
                        ]}
                    >
                        <Checkbox checked={todo.done} onChange={() => handleToggle(todo.id)}>
                            <span
                                style={{
                                    textDecoration: todo.done ? 'line-through' : 'none',
                                    color: todo.done ? '#999' : 'inherit',
                                }}
                            >
                                {todo.text}
                            </span>
                        </Checkbox>
                    </List.Item>
                )}
            />
        </Card>
    )
}
