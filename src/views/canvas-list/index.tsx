import { useCallback, useEffect, useState } from 'react'
import type { TablePaginationConfig } from 'antd'
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
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  const fetchList = useCallback(async (page = pagination.current, pageSize = pagination.pageSize, searchKeyword?: string) => {
    setLoading(true)
    const kw = searchKeyword?.trim()
    try {
      const data = await CanvasApi.getCanvasList(kw ? { page, pageSize, keyword: kw } : { page, pageSize })
      setList(data.list)
      setPagination({
        current: data.page,
        pageSize: data.pageSize,
        total: data.total,
      })
    } catch {
      message.error('加载画布列表失败')
    } finally {
      setLoading(false)
    }
  }, [pagination.current, pagination.pageSize])

  useEffect(() => {
    void fetchList(1, pagination.pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = useCallback(() => {
    void fetchList(1, pagination.pageSize, keyword)
  }, [fetchList, keyword, pagination.pageSize])

  const handleTableChange = useCallback((nextPagination: TablePaginationConfig) => {
    const nextPage = nextPagination.current ?? 1
    const nextPageSize = nextPagination.pageSize ?? 10
    void fetchList(nextPage, nextPageSize)
  }, [fetchList])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await CanvasApi.deleteCanvas(id)
      message.success('已删除')
      void fetchList()
    } catch {
      message.error('删除失败')
    }
  }, [fetchList])

  const columns = [
    {
      title: '画布名称',
      dataIndex: 'name',
      key: 'name',
      width: 260,
      ellipsis: true,
      render: (name: string, record: CanvasSummary) => (
        <a className="block truncate" onClick={() => navigate(`/canvas?id=${record.id}`)}>{name}</a>
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
      width: 60,
      render: (_: unknown, record: CanvasSummary) => (
        <span className="flex gap-1">
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
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
          style={{ width: 360 }}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
          搜索
        </Button>
        <Button className="ml-auto" type="primary" icon={<PlusOutlined />} onClick={() => navigate('/canvas')}>
          新建画布
        </Button>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={list}
        loading={loading}
        onChange={handleTableChange}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </div>
  )
}
