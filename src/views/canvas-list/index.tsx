import { useCallback, useEffect, useState } from 'react'
import type { TablePaginationConfig } from 'antd'
import { Button, Empty, Input, Pagination, Popconfirm, Skeleton, Table, Tag, message } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import CanvasApi from '@/views/canvas/api'
import type { CanvasSummary } from '@/views/canvas/types'

const frameworkColor: Record<string, string> = { vue: '#639922', react: '#378ADD' }

function formatDateTime(value: string) {
  return new Date(value).toLocaleString()
}

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
      render: formatDateTime,
    },
    {
      title: '操作',
      key: 'actions',
      width: 128,
      fixed: 'right' as const,
      render: (_: unknown, record: CanvasSummary) => (
        <span className="flex justify-end gap-1">
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

  const renderFrameworkTag = (framework: string | null) =>
    framework ? (
      <Tag color={frameworkColor[framework]}>{framework === 'vue' ? 'Vue' : 'React'}</Tag>
    ) : (
      <span className="text-gray-400">-</span>
    )

  return (
    <div className="flex h-full flex-col overflow-auto bg-slate-50 p-3 sm:p-5 lg:p-6">
      <div className="mb-3 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:mb-4 sm:flex-row sm:items-center sm:p-4">
        <Input
          placeholder="按名称搜索"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
          className="w-full sm:max-w-[360px]"
        />
        <Button className="w-full sm:w-auto" type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
          搜索
        </Button>
        <Button className="w-full sm:ml-auto sm:w-auto" type="primary" icon={<PlusOutlined />} onClick={() => navigate('/canvas')}>
          新建画布
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-3 md:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <Skeleton active paragraph={{ rows: 3 }} />
            </div>
          ))
        ) : list.length > 0 ? (
          list.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <button
                type="button"
                onClick={() => navigate(`/canvas?id=${item.id}`)}
                className="block w-full truncate text-left text-base font-semibold text-slate-900"
              >
                {item.name}
              </button>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-slate-400">技术栈</div>
                  <div className="mt-1">{renderFrameworkTag(item.framework)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">节点数</div>
                  <div className="mt-1 text-slate-700">{item.nodeCount}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-slate-400">更新时间</div>
                  <div className="mt-1 text-slate-700">{formatDateTime(item.updatedAt)}</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button className="flex-1" onClick={() => navigate(`/canvas?id=${item.id}`)}>
                  编辑
                </Button>
                <Popconfirm title="确定删除这个画布吗？" onConfirm={() => handleDelete(item.id)}>
                  <Button className="flex-1" danger>
                    删除
                  </Button>
                </Popconfirm>
              </div>
            </article>
          ))
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-8">
            <Empty description="暂无画布" />
          </div>
        )}

        <div className="flex justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <Pagination
            size="small"
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            showSizeChanger={false}
            onChange={(page, pageSize) => {
              void fetchList(page, pageSize, keyword)
            }}
          />
        </div>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={list}
        loading={loading}
        onChange={handleTableChange}
        className="responsive-table hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block"
        tableLayout="fixed"
        scroll={{ x: 820 }}
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
