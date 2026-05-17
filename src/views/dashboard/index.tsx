import { useState, useMemo, useCallback, useEffect } from 'react'
import { Tabs, Row, Col, Card, Typography, Button, Space, Tag } from 'antd'
import {
    DashboardOutlined,
    OrderedListOutlined,
    TableOutlined,
    ExperimentOutlined,
} from '@ant-design/icons'
import { usePrevious } from '@/hooks/usePrevious'
import CardItem from './components/CardItem'
import CounterCard from './components/CounterCard'
import TodoList from './components/TodoList'
import DataTable from './components/DataTable'

const { Title, Paragraph, Text } = Typography

// ---- 演示 React.memo 的列表 ----
const NumberList = ({ data }: { data: number[] }) => {
    return (
        <Row gutter={[8, 8]}>
            {data.map(item => (
                <Col span={6} key={item}>
                    <CardItem text={`编号 ${item}`} />
                </Col>
            ))}
        </Row>
    )
}

function Dashboard() {
    const [count, setCount] = useState(0)
    const [multiplier, setMultiplier] = useState(2)

    const prevCount = usePrevious(count)

    // useMemo —— 只在 count 或 multiplier 变化时重新计算
    //  如果这是复杂计算（如大数阶乘），跳过重算就是实实在在的性能提升
    const expensiveValue = useMemo(() => {
        console.log('useMemo 计算中... count:', count, 'multiplier:', multiplier)
        // 模拟耗时计算
        const result = count * multiplier * 1.5
        return result.toFixed(2)
    }, [count, multiplier])

    // useCallback —— 保持 handleIncrement 引用稳定
    //  如果传给 memo 子组件，不会因为引用变化导致子组件重渲染
    const handleIncrement = useCallback(() => {
        setCount(c => c + 1)
    }, [])

    const handleMultiplier = useCallback(() => {
        setMultiplier(m => (m % 5) + 1)
    }, [])

    // useEffect —— 副作用：count 变化时同步处理（如埋点、存储、日志）
    useEffect(() => {
        console.log('count 变化为:', count, '上次值:', prevCount)
    }, [count, prevCount])

    const tabItems = [
        {
            key: 'overview',
            label: (
                <span>
                    <DashboardOutlined />
                    概览 (memo / useMemo / useCallback)
                </span>
            ),
            children: (
                <div>
                    {/* --- memo 演示区 --- */}
                    <Card
                        title="React.memo 卡片列表"
                        style={{ marginBottom: 16 }}
                        extra={
                            <Text type="secondary">
                                点击 counter 按钮，CardItem 不会重渲染（props 没变）
                            </Text>
                        }
                    >
                        <NumberList data={[1, 2, 3, 4]} />
                    </Card>

                    {/* --- useMemo & useCallback 演示区 --- */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Card title="useMemo & useCallback 演示">
                                <div style={{ textAlign: 'center' }}>
                                    <Title level={3}>count: {count}</Title>
                                    <Tag color="purple">乘数: {multiplier}x</Tag>
                                    <Paragraph style={{ marginTop: 16 }}>
                                        <Text type="secondary">
                                            useMemo 计算结果: count × {multiplier} × 1.5 ={' '}
                                        </Text>
                                        <Text strong style={{ fontSize: 20 }}>
                                            {expensiveValue}
                                        </Text>
                                    </Paragraph>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        上次 count: {prevCount ?? '-'}
                                    </Text>
                                </div>
                                <div style={{ textAlign: 'center', marginTop: 16 }}>
                                    <Space>
                                        <Button type="primary" onClick={handleIncrement}>
                                            count +1 (useCallback)
                                        </Button>
                                        <Button onClick={handleMultiplier}>
                                            切换乘数 (useCallback)
                                        </Button>
                                    </Space>
                                </div>
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card title="为什么这样用？">
                                <ul style={{ lineHeight: 2.2, paddingLeft: 20 }}>
                                    <li>
                                        <Tag>useMemo</Tag>{' '}
                                        <strong>缓存计算结果</strong> —— 依赖不变就直接返回缓存，
                                        跳过重复计算
                                    </li>
                                    <li>
                                        <Tag>useCallback</Tag>{' '}
                                        <strong>缓存函数引用</strong> —— 配合 memo 子组件，
                                        避免因函数引用变化导致子树重渲染
                                    </li>
                                    <li>
                                        <Tag>memo</Tag>{' '}
                                        <strong>缓存组件渲染</strong> —— props 浅比较不变就
                                        跳过渲染，列表子项必备
                                    </li>
                                    <li>
                                        <Tag>useRef</Tag>{' '}
                                        <strong>跨渲染存储</strong> —— 修改不触发渲染，
                                        做 DOM 引用 / 存上一帧值
                                    </li>
                                    <li>
                                        <Tag>useEffect</Tag>{' '}
                                        <strong>副作用处理</strong> —— API 调用、订阅、
                                        DOM 操作等渲染后执行
                                    </li>
                                </ul>
                            </Card>
                        </Col>
                    </Row>
                </div>
            ),
        },
        {
            key: 'reducer',
            label: (
                <span>
                    <ExperimentOutlined />
                    useReducer 计数器
                </span>
            ),
            children: <CounterCard />,
        },
        {
            key: 'todo',
            label: (
                <span>
                    <OrderedListOutlined />
                    Todo List
                </span>
            ),
            children: <TodoList />,
        },
        {
            key: 'table',
            label: (
                <span>
                    <TableOutlined />
                    数据表格
                </span>
            ),
            children: <DataTable />,
        },
    ]

    return (
        <div className="flex-1 overflow-auto p-6" style={{ maxWidth: 1400, margin: '0 auto' }}>
            <Title level={2}>Dashboard —— React Hooks 实战</Title>
            <Paragraph type="secondary">
                本页面演示了工作中最常用的 React hooks：memo, useMemo, useCallback,
                useReducer, useRef, useEffect，以及自定义 hooks（usePrevious,
                useDebounce, useLocalStorage）。打开控制台查看渲染日志。
            </Paragraph>

            <Tabs defaultActiveKey="overview" items={tabItems} />
        </div>
    )
}

export default Dashboard
