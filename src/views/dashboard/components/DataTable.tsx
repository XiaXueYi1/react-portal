import { useState, useMemo, useCallback } from 'react'
import { Card, Table, Input, Select, Tag, Space, Statistic } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useDebounce } from '@/hooks/useDebounce'

// ---- 模拟数据 ----
const MOCK_DATA = Array.from({ length: 50 }, (_, i) => ({
    key: i + 1,
    name: `用户 ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: ['admin', 'editor', 'viewer'][i % 3] as string,
    status: i % 3 === 0 ? 'inactive' : 'active',
    visits: Math.floor(Math.random() * 10000),
}))

const ROLE_MAP: Record<string, { label: string; color: string }> = {
    admin: { label: '管理员', color: 'red' },
    editor: { label: '编辑', color: 'blue' },
    viewer: { label: '访客', color: 'green' },
}

export default function DataTable() {
    const [keyword, setKeyword] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('all')

    // useDebounce —— 搜索输入防抖 300ms，避免每次按键都触发重计算
    const debouncedKeyword = useDebounce(keyword, 300)

    // useMemo —— 只在 debouncedKeyword / roleFilter 变化时重新过滤
    //  50 条数据过滤很快，但如果数据来自 API 或数据量很大，这就是必要的优化
    const filteredData = useMemo(() => {
        console.log('useMemo 过滤数据... keyword:', debouncedKeyword, 'role:', roleFilter)
        return MOCK_DATA.filter(item => {
            const matchKeyword =
                !debouncedKeyword ||
                item.name.includes(debouncedKeyword) ||
                item.email.includes(debouncedKeyword)
            const matchRole = roleFilter === 'all' || item.role === roleFilter
            return matchKeyword && matchRole
        })
    }, [debouncedKeyword, roleFilter])

    // useCallback —— 保持引用稳定，避免 Table 不必要的重渲染
    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setKeyword(e.target.value)
    }, [])

    const handleRoleChange = useCallback((value: string) => {
        setRoleFilter(value)
    }, [])

    const columns = [
        { title: 'ID', dataIndex: 'key', width: 60 },
        { title: '姓名', dataIndex: 'name', width: 120 },
        { title: '邮箱', dataIndex: 'email', width: 200 },
        {
            title: '角色',
            dataIndex: 'role',
            width: 100,
            render: (role: string) => (
                <Tag color={ROLE_MAP[role]?.color}>{ROLE_MAP[role]?.label ?? role}</Tag>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (status: string) => (
                <Tag color={status === 'active' ? 'success' : 'default'}>
                    {status === 'active' ? '启用' : '禁用'}
                </Tag>
            ),
        },
        { title: '访问量', dataIndex: 'visits', width: 100 },
    ]

    return (
        <Card title="数据表格 (useMemo + useCallback + useDebounce)">
            <Space style={{ marginBottom: 16 }}>
                <Input
                    placeholder="搜索姓名或邮箱..."
                    prefix={<SearchOutlined />}
                    value={keyword}
                    onChange={handleSearch}
                    allowClear
                    style={{ width: 240 }}
                />
                <Select
                    value={roleFilter}
                    onChange={handleRoleChange}
                    style={{ width: 120 }}
                    options={[
                        { value: 'all', label: '全部角色' },
                        { value: 'admin', label: '管理员' },
                        { value: 'editor', label: '编辑' },
                        { value: 'viewer', label: '访客' },
                    ]}
                />
                <Statistic
                    title="结果"
                    value={filteredData.length}
                    suffix={`/ ${MOCK_DATA.length}`}
                />
            </Space>
            <Table
                columns={columns}
                dataSource={filteredData}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                size="small"
                bordered
            />
        </Card>
    )
}
