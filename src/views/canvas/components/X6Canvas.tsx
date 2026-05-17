import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import { Graph, Edge } from '@antv/x6'
import { register } from '@antv/x6-react-shape'
import type { CanvasNodeData, CanvasEdgeData } from '../types'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../constants'

// ─── React node component ─────────────────────────────────────────────
interface NodeCardProps {
    node?: any
}

function NodeCard({ node }: NodeCardProps) {
    const data: CanvasNodeData | undefined = node?.getData()
    if (!data) return null

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                borderLeftWidth: 4,
                borderLeftColor: CATEGORY_COLORS[data.category],
                background: '#fff',
                padding: '4px 10px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                cursor: 'pointer',
                boxSizing: 'border-box',
                userSelect: 'none',
                // React 组件层必须穿透鼠标事件，否则 X6 连线的 mousedown 触发不到
                pointerEvents: 'none',
            }}
        >
            <span
                style={{
                    fontSize: 13,
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {data.label}
            </span>
            <span
                style={{
                    fontSize: 10,
                    marginTop: 2,
                    padding: '0 4px',
                    borderRadius: 2,
                    backgroundColor: CATEGORY_COLORS[data.category] + '18',
                    color: CATEGORY_COLORS[data.category],
                    display: 'inline-block',
                    width: 'fit-content',
                }}
            >
                {CATEGORY_LABELS[data.category]}
            </span>
        </div>
    )
}

let registered = false
if (!registered) {
    register({
        shape: 'canvas-node',
        component: NodeCard,
        effect: ['data'],
    })
    registered = true
}

// ─── Port 配置 ────────────────────────────────────────────────────────
// X6 v2 必须用 ports 配置连接桩，magnet: true 是 v1 写法不生效
const makePortAttrs = () => ({
    circle: {
        r: 5,
        magnet: true,
        stroke: '#94a3b8',
        strokeWidth: 1.5,
        fill: '#fff',
        visibility: 'hidden', // hover 时由事件控制显示
    },
})

const DEFAULT_PORTS = {
    groups: {
        top: { position: 'top', attrs: makePortAttrs() },
        bottom: { position: 'bottom', attrs: makePortAttrs() },
        left: { position: 'left', attrs: makePortAttrs() },
        right: { position: 'right', attrs: makePortAttrs() },
    },
    items: [
        { group: 'top' },
        { group: 'bottom' },
        { group: 'left' },
        { group: 'right' },
    ],
}

// ─── Edge 公共样式 ────────────────────────────────────────────────────
const EDGE_ATTRS = {
    line: {
        stroke: '#94a3b8',
        strokeWidth: 2,
        targetMarker: { name: 'block', width: 10, height: 8, fill: '#94a3b8' },
    },
}

// orth 是 X6 v2 内置 router（直角折线），视觉与 manhattan 相近
// manhattan 需要额外安装插件，用 orth 避免报错
function buildEdge(sourceId: string, targetId: string, edgeId?: string): Edge {
    return new Edge({
        id: edgeId,
        source: { cell: sourceId },
        target: { cell: targetId },
        router: { name: 'orth', args: { padding: 20 } },
        connector: { name: 'rounded', args: { radius: 6 } },
        attrs: EDGE_ATTRS,
        zIndex: 0,
    })
}

// ─── Handle 类型 ─────────────────────────────────────────────────────
export interface X6CanvasHandle {
    addNode: (data: CanvasNodeData) => void
    removeNode: (id: string) => void
    updateNode: (id: string, patch: Partial<CanvasNodeData>) => void
    getNodeData: (id: string) => CanvasNodeData | undefined
    getAllNodeData: () => CanvasNodeData[]
    addEdge: (data: CanvasEdgeData) => void
    removeEdge: (id: string) => void
    selectNode: (id: string | null) => void
}

interface Props {
    onNodeClick: (id: string) => void
    onNodeDoubleClick: (id: string) => void
    onCanvasClick: () => void
    onNodeMove: (id: string, x: number, y: number) => void
    onEdgeCreated: (edge: CanvasEdgeData) => void
    onEdgeRemoved: (edgeId: string) => void
    onDropFromTree: (e: React.DragEvent) => void
}

const NODE_W = 148
const NODE_H = 52

const X6Canvas = forwardRef<X6CanvasHandle, Props>((
    { onNodeClick, onNodeDoubleClick, onCanvasClick, onNodeMove, onEdgeCreated, onEdgeRemoved, onDropFromTree },
    ref,
) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const graphRef = useRef<Graph | null>(null)
    const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // 用 ref 保存最新回调，避免 graph 事件绑定时形成闭包陷阱
    const cbRef = useRef({ onNodeClick, onNodeDoubleClick, onCanvasClick, onNodeMove, onEdgeCreated, onEdgeRemoved })
    useEffect(() => {
        cbRef.current = { onNodeClick, onNodeDoubleClick, onCanvasClick, onNodeMove, onEdgeCreated, onEdgeRemoved }
    })

    // ─── 初始化 Graph（只跑一次）──────────────────────────────────
    useEffect(() => {
        if (!containerRef.current || graphRef.current) return
        const rect = containerRef.current.getBoundingClientRect()

        const graph = new Graph({
            container: containerRef.current,
            width: rect.width || 800,
            height: rect.height || 600,
            grid: {
                size: 16,
                visible: true,
                type: 'dot',
                args: { color: '#e2e8f0', thickness: 1 },
            },
            panning: { enabled: true },
            mousewheel: { enabled: true, modifiers: 'ctrl' },
            interacting: { nodeMovable: true },
            connecting: {
                router: { name: 'orth', args: { padding: 20 } },
                connector: { name: 'rounded', args: { radius: 6 } },
                snap: { radius: 20 },
                allowBlank: false,
                allowMulti: false,
                allowLoop: false,
                highlight: true,
                // 拖线过程中的预览 edge
                createEdge() {
                    return new Edge({
                        router: { name: 'orth', args: { padding: 20 } },
                        connector: { name: 'rounded', args: { radius: 6 } },
                        attrs: EDGE_ATTRS,
                        zIndex: 0,
                    })
                },
                validateConnection({ sourceCell, targetCell }: { sourceCell: any; targetCell: any }) {
                    if (!sourceCell || !targetCell) return false
                    if (sourceCell.id === targetCell.id) return false
                    const src = sourceCell.getData() as CanvasNodeData | undefined
                    const tgt = targetCell.getData() as CanvasNodeData | undefined
                    if (src?.category === 'PROJECT' || tgt?.category === 'PROJECT') return false
                    return true
                },
            } as any,
        })

        // 连接桩 hover 显隐
        graph.on('node:mouseenter', ({ node }: { node: any }) => {
            node.getPorts().forEach((port: any) => {
                node.setPortProp(port.id, 'attrs/circle/visibility', 'visible')
            })
        })
        graph.on('node:mouseleave', ({ node }: { node: any }) => {
            node.getPorts().forEach((port: any) => {
                node.setPortProp(port.id, 'attrs/circle/visibility', 'hidden')
            })
        })

        // 单击 / 双击区分
        graph.on('node:click', ({ node }: { node: any }) => {
            const id = node.id as string
            if (!id) return
            if (clickTimerRef.current) {
                clearTimeout(clickTimerRef.current)
                clickTimerRef.current = null
                cbRef.current.onNodeDoubleClick(id)
            } else {
                clickTimerRef.current = setTimeout(() => {
                    clickTimerRef.current = null
                    cbRef.current.onNodeClick(id)
                }, 280)
            }
        })

        graph.on('blank:click', () => cbRef.current.onCanvasClick())

        graph.on('node:moved', ({ node }: { node: any }) => {
            const pos = node.getPosition()
            cbRef.current.onNodeMove(node.id as string, pos.x, pos.y)
        })

        graph.on('edge:connected', ({ edge, isNew }: { edge: any; isNew: boolean }) => {
            if (!isNew) return
            const src = edge.getSourceCellId()
            const tgt = edge.getTargetCellId()
            if (!src || !tgt) return
            cbRef.current.onEdgeCreated({ id: edge.id as string, sourceId: src, targetId: tgt })
        })

        graph.on('edge:removed', ({ edge }: { edge: any }) => {
            cbRef.current.onEdgeRemoved(edge.id as string)
        })

        graphRef.current = graph

        const observer = new ResizeObserver(() => {
            if (containerRef.current) {
                graph.resize(containerRef.current.clientWidth, containerRef.current.clientHeight)
            }
        })
        observer.observe(containerRef.current)

        return () => {
            if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
            observer.disconnect()
            graph.dispose()
            graphRef.current = null
        }
    }, [])

    // ─── Imperative API ───────────────────────────────────────────
    const addNode = useCallback((data: CanvasNodeData) => {
        const graph = graphRef.current
        if (!graph) return
        graph.getNodes().forEach((n) => n.removeTools())
        graph.addNode({
            id: data.id,
            shape: 'canvas-node',
            x: data.positionX,
            y: data.positionY,
            width: NODE_W,
            height: NODE_H,
            data,
            ports: DEFAULT_PORTS,
        })
    }, [])

    const removeNode = useCallback((id: string) => {
        graphRef.current?.removeCell(id)
    }, [])

    const updateNode = useCallback((id: string, patch: Partial<CanvasNodeData>) => {
        const node = graphRef.current?.getCellById(id)
        if (!node) return
        node.setData({ ...(node.getData() as CanvasNodeData), ...patch }, { overwrite: true })
    }, [])

    const getNodeData = useCallback((id: string): CanvasNodeData | undefined => {
        return graphRef.current?.getCellById(id)?.getData() as CanvasNodeData | undefined
    }, [])

    const getAllNodeData = useCallback((): CanvasNodeData[] => {
        return (graphRef.current?.getNodes() ?? []).map((n) => n.getData() as CanvasNodeData)
    }, [])

    const addEdge = useCallback((data: CanvasEdgeData) => {
        const graph = graphRef.current
        if (!graph) return
        if (graph.getCellById(data.id)) return
        graph.addEdge(buildEdge(data.sourceId, data.targetId, data.id))
    }, [])

    const removeEdge = useCallback((id: string) => {
        graphRef.current?.removeCell(id)
    }, [])

    const selectNode = useCallback((id: string | null) => {
        const graph = graphRef.current
        if (!graph) return
        graph.getNodes().forEach((n) => n.removeTools())
        if (!id) return
        const node = graph.getCellById(id)
        if (!node) return
        node.addTools([
            {
                name: 'boundary',
                args: { padding: 4, attrs: { fill: 'none', stroke: '#378ADD', strokeWidth: 2, rx: 6 } },
            },
            {
                name: 'button-remove',
                args: { x: '100%', y: 0, offset: { x: 4, y: -4 } },
            },
        ])
    }, [])

    useImperativeHandle(ref, () => ({
        addNode, removeNode, updateNode, getNodeData, getAllNodeData, addEdge, removeEdge, selectNode,
    }), [addNode, removeNode, updateNode, getNodeData, getAllNodeData, addEdge, removeEdge, selectNode])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
    }, [])

    const handleDrop = useCallback(
        (e: React.DragEvent) => onDropFromTree(e),
        [onDropFromTree],
    )

    return (
        <div className="flex-1 relative overflow-hidden min-h-0">
            <div
                ref={containerRef}
                className="absolute inset-0"
                style={{ width: '100%', height: '100%' }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            />
        </div>
    )
})

X6Canvas.displayName = 'X6Canvas'

export default X6Canvas