import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Empty, Input, Spin, Tag, message } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router'
import CanvasApi from './api'
import NodeTree from './components/NodeTree'
import NodeDrawer from './components/NodeDrawer'
import X6Canvas, { type X6CanvasHandle } from './components/X6Canvas'
import { CATEGORY_COLORS } from './constants'
import type {
  CanvasDetail,
  CanvasEdgeData,
  CanvasFramework,
  CanvasNodeData,
  DragNodeData,
  NodeTemplate,
  SaveCanvasPayload,
} from './types'

function normalizeFramework(nodes: CanvasNodeData[]): CanvasFramework {
  if (nodes.some((node) => node.category === 'VUE')) return 'vue'
  if (nodes.some((node) => node.category === 'REACT')) return 'react'
  return null
}

function createLocalId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`
}

function normalizeCanvasDetail(raw: CanvasDetail): CanvasDetail {
  const maybeNested = raw as CanvasDetail & { canvas?: CanvasDetail; detail?: CanvasDetail }
  const detail = maybeNested.canvas ?? maybeNested.detail ?? raw

  return {
    ...detail,
    nodes: Array.isArray(detail.nodes) ? detail.nodes : [],
    edges: Array.isArray(detail.edges) ? detail.edges : [],
  }
}

function toSavePayload(detail: CanvasDetail, nodes: CanvasNodeData[], edges: CanvasEdgeData[]): SaveCanvasPayload {
  return {
    ...(detail.id ? { id: detail.id } : {}),
    name: detail.name.trim() || '未命名画布',
    description: detail.description ?? null,
    framework: normalizeFramework(nodes),
    thumbnail: detail.thumbnail ?? null,
    nodes: nodes.map((node) => ({
      id: node.id,
      templateId: node.templateId,
      label: node.label,
      note: node.note,
      category: node.category,
      description: node.description,
      positionX: node.positionX,
      positionY: node.positionY,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      sourcePortId: edge.sourcePortId,
      targetPortId: edge.targetPortId,
      label: edge.label,
      style: edge.style ?? null,
    })),
  }
}

function Canvas() {
  const x6Ref = useRef<X6CanvasHandle>(null)
  const [searchParams] = useSearchParams()
  const initialCanvasId = searchParams.get('id') ?? searchParams.get('canvasId')
  const [templates, setTemplates] = useState<NodeTemplate[]>([])
  const [canvasDetail, setCanvasDetail] = useState<CanvasDetail | null>(null)
  const [nodes, setNodes] = useState<CanvasNodeData[]>([])
  const [edges, setEdges] = useState<CanvasEdgeData[]>([])
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [graphVersion, setGraphVersion] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const framework = useMemo(() => normalizeFramework(nodes), [nodes])
  const selectedNode = selectedNodeId ? nodes.find((node) => node.id === selectedNodeId) ?? null : null

  const scheduleGraphLoad = useCallback((nextNodes: CanvasNodeData[], nextEdges: CanvasEdgeData[], attempt = 0) => {
    window.requestAnimationFrame(() => {
      if (x6Ref.current) {
        x6Ref.current.loadGraph(nextNodes, nextEdges)
        return
      }

      if (attempt < 10) {
        scheduleGraphLoad(nextNodes, nextEdges, attempt + 1)
      }
    })
  }, [])

  const loadTemplates = useCallback(async () => {
    try {
      const templateList = await CanvasApi.getTemplates()
      setTemplates(templateList)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载模板失败')
    }
  }, [])

  const loadCanvasDetail = useCallback(async (canvasId: string) => {
    setDetailLoading(true)
    try {
      const detail = normalizeCanvasDetail(await CanvasApi.getCanvasDetail(canvasId))
      const nextNodes = detail.nodes ?? []
      const nextEdges = detail.edges ?? []
      console.info('[canvas] detail loaded', { canvasId, nodes: nextNodes.length, edges: nextEdges.length, detail })

      setCanvasDetail(detail)
      setNodes(nextNodes)
      setEdges(nextEdges)
      setGraphVersion((prev) => prev + 1)
      scheduleGraphLoad(nextNodes, nextEdges)
      setSelectedNodeId(null)
      setDrawerOpen(false)
      setDirty(false)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载画布详情失败')
    } finally {
      setDetailLoading(false)
    }
  }, [scheduleGraphLoad])

  // Load templates once on mount
  useEffect(() => {
    void loadTemplates()
  }, [loadTemplates])

  // Handle canvas loading or creation when initialCanvasId changes
  useEffect(() => {
    setLoading(true)
    if (initialCanvasId) {
      void loadCanvasDetail(initialCanvasId).finally(() => setLoading(false))
    } else {
      setCanvasDetail({
        id: '',
        name: '未命名画布',
        description: '',
        framework: null,
        thumbnail: null,
        nodes: [],
        edges: [],
      })
      setNodes([])
      setEdges([])
      setGraphVersion((prev) => prev + 1)
      scheduleGraphLoad([], [])
      setDirty(true)
      setLoading(false)
    }
  }, [initialCanvasId, loadCanvasDetail, scheduleGraphLoad])

  const handleDropFromTree = useCallback(
    (event: React.DragEvent) => {
      if (!canvasDetail) {
        message.warning('请先创建或选择画布')
        return
      }

      const json = event.dataTransfer.getData('application/json')
      if (!json) return

      const data = JSON.parse(json) as DragNodeData
      const template = templates.find((item) => item.id === data.key)
      if (!template) return

      const category = template.category
      if (
        category !== 'COMMON' &&
        category !== 'PROJECT' &&
        framework &&
        category.toUpperCase() !== framework.toUpperCase()
      ) {
        message.warning(`当前画布已锁定为 ${framework === 'vue' ? 'Vue' : 'React'}`)
        return
      }

      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
      const newNode: CanvasNodeData = {
        id: createLocalId('node'),
        templateId: template.id,
        label: template.name,
        category: template.category,
        description: template.description,
        note: '',
        positionX: event.clientX - rect.left - 74,
        positionY: event.clientY - rect.top - 26,
      }

      setNodes((prev) => [...prev, newNode])
      x6Ref.current?.addNode(newNode)
      setDirty(true)
    },
    [canvasDetail, framework, templates],
  )

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId)
    x6Ref.current?.selectNode(nodeId)
  }, [])

  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId)
    x6Ref.current?.selectNode(nodeId)
    setDrawerOpen(true)
  }, [])

  const handleCanvasClick = useCallback(() => {
    setSelectedNodeId(null)
    setDrawerOpen(false)
    x6Ref.current?.selectNode(null)
  }, [])

  const handleNodeMove = useCallback((id: string, x: number, y: number) => {
    setNodes((prev) => prev.map((node) => (node.id === id ? { ...node, positionX: x, positionY: y } : node)))
    setDirty(true)
  }, [])

  const handleDeleteNodeLocal = useCallback(
    (nodeId: string) => {
      setNodes((prev) => prev.filter((node) => node.id !== nodeId))
      setEdges((prev) => prev.filter((edge) => edge.sourceId !== nodeId && edge.targetId !== nodeId))
      if (selectedNodeId === nodeId) {
        setDrawerOpen(false)
        setSelectedNodeId(null)
      }
      setDirty(true)
    },
    [selectedNodeId],
  )

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      handleDeleteNodeLocal(nodeId)
      x6Ref.current?.removeNode(nodeId)
    },
    [handleDeleteNodeLocal],
  )

  const handleEdgeCreated = useCallback((edge: CanvasEdgeData) => {
    setEdges((prev) => {
      const exists = prev.some(
        (item) =>
          item.sourceId === edge.sourceId &&
          item.targetId === edge.targetId &&
          item.sourcePortId === edge.sourcePortId &&
          item.targetPortId === edge.targetPortId,
      )
      if (exists) return prev
      return [...prev, edge]
    })
    setDirty(true)
  }, [])

  const handleEdgeRemoved = useCallback((edgeId: string) => {
    setEdges((prev) => prev.filter((edge) => edge.id !== edgeId))
    setDirty(true)
  }, [])

  const handleDrawerSave = useCallback(
    (note: string) => {
      if (!selectedNodeId) return
      setNodes((prev) => prev.map((node) => (node.id === selectedNodeId ? { ...node, note } : node)))
      x6Ref.current?.updateNode(selectedNodeId, { note })
      setDirty(true)
    },
    [selectedNodeId],
  )

  const handleCanvasNameChange = useCallback((name: string) => {
    setCanvasDetail((prev) => (prev ? { ...prev, name } : prev))
    setDirty(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (!canvasDetail) return

    setSaving(true)
    try {
      const payload = toSavePayload(canvasDetail, nodes, edges)
      await CanvasApi.saveCanvas(payload)
      message.success('保存成功')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }, [canvasDetail, edges, nodes])

  return (
    <div className="flex-1 flex min-h-0">
      <aside className="w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-3 border-b border-gray-100">
          <Input
            value={canvasDetail?.name ?? ''}
            placeholder="画布名称"
            disabled={!canvasDetail}
            onChange={(event) => handleCanvasNameChange(event.target.value)}
          />
        </div>

        <div className="p-3 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-400 tracking-wide">节点列表</h3>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <NodeTree framework={framework} templates={templates} loading={loading} />
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="h-11 shrink-0 border-b border-gray-200 bg-white flex items-center px-4 gap-3">
          {framework ? (
            <Tag color={framework === 'vue' ? CATEGORY_COLORS.VUE : CATEGORY_COLORS.REACT}>
              已锁定：{framework === 'vue' ? 'Vue' : 'React'}
            </Tag>
          ) : (
            <Tag>未锁定</Tag>
          )}
          <span className="min-w-0 flex-1 truncate text-sm text-gray-500">
            {canvasDetail?.name ?? '未选择画布'}
            {dirty ? ' - 未保存' : ''}
          </span>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => void handleSave()}
            loading={saving}
            disabled={!canvasDetail || !dirty}
          >
            保存
          </Button>
        </div>

        <div className="relative flex-1 min-h-0">
          {canvasDetail ? (
            <X6Canvas
              key={canvasDetail.id || 'new'}
              ref={x6Ref}
              graphVersion={graphVersion}
              initialNodes={nodes}
              initialEdges={edges}
              onNodeClick={handleNodeClick}
              onNodeDoubleClick={handleNodeDoubleClick}
              onCanvasClick={handleCanvasClick}
              onNodeMove={handleNodeMove}
              onNodeRemoved={handleDeleteNodeLocal}
              onEdgeCreated={handleEdgeCreated}
              onEdgeRemoved={handleEdgeRemoved}
              onDropFromTree={handleDropFromTree}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
              <Empty description="暂无画布" />
            </div>
          )}
          {detailLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50">
              <Spin />
            </div>
          )}
        </div>
      </main>

      <NodeDrawer
        open={drawerOpen}
        node={selectedNode}
        templates={templates}
        onClose={() => setDrawerOpen(false)}
        onSave={handleDrawerSave}
        onDelete={handleDeleteNode}
      />
    </div>
  )
}

export default Canvas
