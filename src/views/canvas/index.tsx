import { useState, useCallback, useRef } from 'react'
import { Tag } from 'antd'
import NodeTree from './components/NodeTree'
import NodeDrawer from './components/NodeDrawer'
import X6Canvas, { type X6CanvasHandle } from './components/X6Canvas'
import { CATEGORY_COLORS } from './constants'
import { NODE_TEMPLATES } from './data'
import type { CanvasNodeData, CanvasEdgeData, DragNodeData } from './types'

type Framework = 'vue' | 'react' | null

function Canvas() {
  const x6Ref = useRef<X6CanvasHandle>(null)

  const [nodes, setNodes] = useState<CanvasNodeData[]>([])
  const [edges, setEdges] = useState<CanvasEdgeData[]>([])
  const [framework, setFramework] = useState<Framework>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) ?? null : null

  // ─── Drop from NodeTree → create node ─────────────────────────────
  const handleDropFromTree = useCallback(
    (e: React.DragEvent) => {
      const json = e.dataTransfer.getData('application/json')
      if (!json) return

      const data = JSON.parse(json) as DragNodeData
      const template = NODE_TEMPLATES.find((t) => t.id === data.key)
      if (!template) return

      const cat = template.category
      if (
        cat !== 'COMMON' &&
        cat !== 'PROJECT' &&
        framework &&
        cat.toUpperCase() !== framework.toUpperCase()
      ) {
        return
      }

      // Calc drop position relative to X6 graph
      const target = e.currentTarget as HTMLElement
      const rect = target.getBoundingClientRect()
      const newNode: CanvasNodeData = {
        id: `${data.key}-${Date.now()}`,
        templateId: template.id,
        label: template.name,
        category: template.category,
        description: template.description,
        note: '',
        positionX: e.clientX - rect.left - 74,
        positionY: e.clientY - rect.top - 26,
      }

      setNodes((prev) => [...prev, newNode])
      x6Ref.current?.addNode(newNode)

      if (!framework && cat === 'VUE') setFramework('vue')
      if (!framework && cat === 'REACT') setFramework('react')
    },
    [framework],
  )

  // ─── Node single click → select ───────────────────────────────────
  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId)
    x6Ref.current?.selectNode(nodeId)
  }, [])

  // ─── Node double click → open drawer ──────────────────────────────
  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId)
    x6Ref.current?.selectNode(nodeId)
    setDrawerOpen(true)
  }, [])

  // ─── Canvas click → deselect / close drawer ──────────────────────
  const handleCanvasClick = useCallback(() => {
    setSelectedNodeId(null)
    setDrawerOpen(false)
    x6Ref.current?.selectNode(null)
  }, [])

  // ─── Node moved in X6 → sync position to React state ──────────────
  const handleNodeMove = useCallback((id: string, x: number, y: number) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, positionX: x, positionY: y } : n)))
  }, [])

  // ─── Edge created ─────────────────────────────────────────────────
  const handleEdgeCreated = useCallback((edge: CanvasEdgeData) => {
    setEdges((prev) => {
      if (prev.some((e) => e.id === edge.id)) return prev
      return [...prev, edge]
    })
  }, [])

  // ─── Edge removed (by X6 remove tool) ─────────────────────────────
  const handleEdgeRemoved = useCallback((edgeId: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId))
  }, [])

  // ─── Drawer save ──────────────────────────────────────────────────
  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false)
  }, [])

  const handleDrawerSave = useCallback(
    (label: string, note: string) => {
      if (!selectedNodeId) return
      setNodes((prev) =>
        prev.map((n) => (n.id === selectedNodeId ? { ...n, label, note } : n)),
      )
      x6Ref.current?.updateNode(selectedNodeId, { label, note })
    },
    [selectedNodeId],
  )

  // ─── Delete node ───────────────────────────────────────────────────
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((prev) => {
        const next = prev.filter((n) => n.id !== nodeId)
        if (framework === 'vue' && !next.some((n) => n.category === 'VUE')) setFramework(null)
        if (framework === 'react' && !next.some((n) => n.category === 'REACT')) setFramework(null)
        return next
      })
      setEdges((prev) => prev.filter((e) => e.sourceId !== nodeId && e.targetId !== nodeId))
      x6Ref.current?.removeNode(nodeId)
      if (selectedNodeId === nodeId) {
        setDrawerOpen(false)
        setSelectedNodeId(null)
      }
    },
    [framework, selectedNodeId],
  )

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex min-h-0">
      {/* 左侧节点面板 */}
      <aside className="w-60 shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-3 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-400 tracking-wide uppercase">节点列表</h3>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <NodeTree framework={framework} />
        </div>
        <div className="p-3 border-t border-gray-100 text-xs text-gray-400">
          节点: {nodes.length} · 连线: {edges.length}
        </div>
      </aside>

      {/* 右侧画布区域 */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* 画布工具栏 */}
        <div className="h-10 shrink-0 border-b border-gray-200 bg-white flex items-center px-4 gap-3">
          {framework ? (
            <Tag color={framework === 'vue' ? CATEGORY_COLORS.VUE : CATEGORY_COLORS.REACT}>
              已锁定: {framework === 'vue' ? 'Vue 生态' : 'React 生态'}
            </Tag>
          ) : (
            <Tag>未锁定</Tag>
          )}
          <span className="text-xs text-gray-400">
            拖入首个 Vue 或 React 节点将锁定画布 · 从端口拖拽即可连线
          </span>
        </div>

        {/* X6 画布 */}
        <X6Canvas
          ref={x6Ref}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          onCanvasClick={handleCanvasClick}
          onNodeMove={handleNodeMove}
          onEdgeCreated={handleEdgeCreated}
          onEdgeRemoved={handleEdgeRemoved}
          onDropFromTree={handleDropFromTree}
        />
      </main>

      {/* 节点属性抽屉 */}
      <NodeDrawer
        open={drawerOpen}
        node={selectedNode}
        onClose={handleDrawerClose}
        onSave={handleDrawerSave}
        onDelete={handleDeleteNode}
      />
    </div>
  )
}

export default Canvas
