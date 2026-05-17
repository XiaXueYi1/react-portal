import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Input, Popconfirm, Table, Tag, message } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import CanvasApi from '@/views/canvas/api'
import type { CanvasSummary } from '@/views/canvas/types'

const frameworkColor: Record<string, string> = { vue: '#639922', react: '#378ADD' }

export default function CanvasList() {
  const navigate = useNavigate()
  const [list, setList] = useState<CanvasSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const data = await CanvasApi.getCanvasList()
      setList(data)
    } catch {
      message.error('加载画布列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchList() }, [fetchList])

  const filtered = useMemo(() => {
    if (!keyword.trim()) return list
    const kw = keyword.trim().toLowerCase()
    return list.filter((item) => item.name.toLowerCase().includes(kw))
  }, [list, keyword])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await CanvasApi.deleteCanvas(id)
      message.success('已删除')
      fetchList()
    } catch {
      message.error('删除失败')
    }
  }, [fetchList])

  const columns = [
    {
      title: '画布名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: CanvasSummary) => (
        <a onClick={() => navigate(`/canvas?id=${record.id}`)}>{name}</a>
      ),
    },
    {
      title: '技术栈',
      dataIndex: 'framework',
      key: 'framework',
      width: 120,
      render: (fw: string | null) =>
        fw ? <Tag color={frameworkColor[fw]}>{fw === 'vue' ? 'Vue' : 'React'}</Tag> : <span className="text-gray-400">-</span>,
    },
    {
      title: '节点数',
      dataIndex: 'nodeCount',
      key: 'nodeCount',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 200,
      render: (val: string) => new Date(val).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_: unknown, record: CanvasSummary) => (
        <span className="flex gap-2">
          <Button type="link" size="small" onClick={() => navigate(`/canvas?id=${record.id}`)}>
            编辑
          </Button>
          <Popconfirm title="确定删除这个画布吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </span>
      ),
    },
  ]

  return (
    <div className="p-6 h-full overflow-auto flex flex-col">
      <div className="mb-4 flex items-center gap-3">
        <Input
          placeholder="按名称搜索"
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
          style={{ width: 260 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/canvas')}>
          新建画布
        </Button>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
      />
    </div>
  )
}
