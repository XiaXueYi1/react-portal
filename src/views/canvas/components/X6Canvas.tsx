import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import { Graph, Edge, Node as X6Node, type Cell } from '@antv/x6'
import { register } from '@antv/x6-react-shape'
import type { CanvasNodeData, CanvasEdgeData, NodeCardProps, X6CanvasHandle, X6CanvasProps } from '../types'
import {
  CANVAS_NODE_REGISTRY_FLAG,
  CANVAS_NODE_SHAPE,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  EDGE_COLOR,
  EDGE_CONNECTOR,
  EDGE_ROUTER,
  NODE_H,
  NODE_W,
  PORT_COLOR,
  PORTS,
} from '../constants'

export type { X6CanvasHandle } from '../types'

function NodeCard({ node }: NodeCardProps) {
  const data = node?.getData<CanvasNodeData>()
  if (!data) return null

  return (
    <div
      style={{
        width: NODE_W,
        minWidth: NODE_W,
        maxWidth: NODE_W,
        height: NODE_H,
        minHeight: NODE_H,
        maxHeight: NODE_H,
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
        boxSizing: 'border-box',
        userSelect: 'none',
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

if (!(globalThis as Record<string, unknown>)[CANVAS_NODE_REGISTRY_FLAG]) {
  register({
    shape: CANVAS_NODE_SHAPE,
    component: NodeCard,
    effect: ['data'],
  })
    ; (globalThis as Record<string, unknown>)[CANVAS_NODE_REGISTRY_FLAG] = true
}

function buildEdge(
  sourceId: string,
  targetId: string,
  edgeId?: string,
  sourcePortId?: string,
  targetPortId?: string,
) {
  return {
    id: edgeId,
    source: sourcePortId ? { cell: sourceId, port: sourcePortId } : { cell: sourceId },
    target: targetPortId ? { cell: targetId, port: targetPortId } : { cell: targetId },
    router: EDGE_ROUTER,
    connector: EDGE_CONNECTOR,
    attrs: {
      line: {
        stroke: EDGE_COLOR,
        strokeWidth: 3,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        targetMarker: { name: 'block', width: 12, height: 8, fill: EDGE_COLOR, stroke: EDGE_COLOR },
      },
    },
    zIndex: 1,
  }
}

const X6Canvas = forwardRef<X6CanvasHandle, X6CanvasProps>(
  (
    {
      graphVersion,
      initialNodes,
      initialEdges,
      onNodeClick,
      onNodeDoubleClick,
      onCanvasClick,
      onNodeMove,
      onNodeRemoved,
      onEdgeCreated,
      onEdgeRemoved,
      onDropFromTree,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const graphRef = useRef<Graph | null>(null)
    const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const programmaticRemovedNodeIdsRef = useRef<Set<string>>(new Set())
    const loadingGraphRef = useRef(false)
    const pendingGraphDataRef = useRef<{ nodes: CanvasNodeData[]; edges: CanvasEdgeData[] } | null>(null)
    const lastAppliedVersionRef = useRef(0)

    const cbRef = useRef({
      onNodeClick,
      onNodeDoubleClick,
      onCanvasClick,
      onNodeMove,
      onNodeRemoved,
      onEdgeCreated,
      onEdgeRemoved,
    })

    useEffect(() => {
      cbRef.current = {
        onNodeClick,
        onNodeDoubleClick,
        onCanvasClick,
        onNodeMove,
        onNodeRemoved,
        onEdgeCreated,
        onEdgeRemoved,
      }
    })

    const setPortColor = useCallback((node: X6Node, portId: string, color: string) => {
      node.setPortProp(portId, 'attrs/circle/stroke', color)
      node.setPortProp(portId, 'attrs/circle/strokeWidth', 2)
    }, [])

    const syncNodePorts = useCallback(
      (node: X6Node) => {
        node.getPorts().forEach((port) => {
          const portId = port.id
          if (!portId) return

          setPortColor(node, portId, PORT_COLOR)
        })
      },
      [setPortColor],
    )

    const applyGraphData = useCallback(
      (graph: Graph, nodes: CanvasNodeData[], edges: CanvasEdgeData[]) => {
        console.info('[canvas] apply graph data', { nodes: nodes.length, edges: edges.length })
        loadingGraphRef.current = true
        try {
          const nodeCells = nodes.map((data) =>
            graph.createNode({
              id: data.id,
              shape: CANVAS_NODE_SHAPE,
              primer: 'rect',
              x: data.positionX,
              y: data.positionY,
              width: NODE_W,
              height: NODE_H,
              data,
              ports: PORTS,
            }),
          )

          const nodeIds = new Set(nodes.map((node) => node.id))
          const edgeCells = edges
            .filter((edge) => nodeIds.has(edge.sourceId) && nodeIds.has(edge.targetId))
            .map((edge) =>
              graph.createEdge(buildEdge(
                edge.sourceId,
                edge.targetId,
                edge.id,
                edge.sourcePortId,
                edge.targetPortId,
              )),
            )

          graph.resetCells([...nodeCells, ...edgeCells])
          graph.getNodes().forEach((node) => syncNodePorts(node))
        } finally {
          loadingGraphRef.current = false
        }
      },
      [syncNodePorts],
    )

    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      const createGraph = (width: number, height: number) => {
        const graph = new Graph({
          container,
          width,
          height,
        grid: {
          size: 16,
          visible: true,
          type: 'dot',
          args: { color: '#e2e8f0', thickness: 1 },
        },
        panning: { enabled: true, modifiers: 'shift' },
        mousewheel: { enabled: true, modifiers: 'ctrl' },
        interacting: { nodeMovable: true },
        translating: { restrict: true },
        connecting: {
          connector: EDGE_CONNECTOR,
          connectionPoint: 'anchor',
          snap: { radius: 20 },
          allowBlank: false,
          allowEdge: false,
          allowMulti: true,
          allowLoop: false,
          highlight: true,
          createEdge() {
            return this.createEdge(buildEdge('', ''))
          },
          validateConnection({
            sourceCell,
            targetCell,
            sourceMagnet,
            targetMagnet,
          }: {
            sourceCell?: Cell | null
            targetCell?: Cell | null
            sourceMagnet?: Element | null
            targetMagnet?: Element | null
          }) {
            if (!sourceCell || !targetCell || !sourceMagnet || !targetMagnet) return false
            if (sourceCell.id === targetCell.id) return false

            const src = sourceCell.getData<CanvasNodeData>()
            const tgt = targetCell.getData<CanvasNodeData>()
            if (src?.category === 'PROJECT' || tgt?.category === 'PROJECT') return false

            return true
          },
        },
        highlighting: {
          magnetAdsorbed: {
            name: 'stroke',
            args: {
              attrs: {
                fill: '#ffffff',
                stroke: PORT_COLOR,
                strokeWidth: 2,
              },
            },
          },
        },
        })

        graph.on('edge:mouseenter', ({ edge }: { edge: Edge }) => {
          edge.addTools([{ name: 'button-remove', args: { distance: -40 } }])
        })

        graph.on('edge:mouseleave', ({ edge }: { edge: Edge }) => {
          edge.removeTools()
        })

        graph.on('node:click', ({ node }: { node: X6Node }) => {
          const id = node.id
          if (!id) return

          if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current)
            clickTimerRef.current = null
            cbRef.current.onNodeDoubleClick(id)
            return
          }

          clickTimerRef.current = setTimeout(() => {
            clickTimerRef.current = null
            cbRef.current.onNodeClick(id)
          }, 280)
        })

        graph.on('blank:click', () => cbRef.current.onCanvasClick())

        graph.on('node:moved', ({ node }: { node: X6Node }) => {
          const pos = node.getPosition()
          cbRef.current.onNodeMove(node.id, pos.x, pos.y)
        })

        graph.on('node:removed', ({ node }: { node: X6Node }) => {
          if (loadingGraphRef.current) return

          const removedByApi = programmaticRemovedNodeIdsRef.current.has(node.id)
          if (removedByApi) {
            programmaticRemovedNodeIdsRef.current.delete(node.id)
            return
          }

          cbRef.current.onNodeRemoved(node.id)
        })

        graph.on('edge:connected', ({ edge, isNew }: { edge: Edge; isNew: boolean }) => {
          if (loadingGraphRef.current) return
          if (!isNew) return
          const src = edge.getSourceCellId()
          const tgt = edge.getTargetCellId()
          if (!src || !tgt) return

          const sourceNode = graph.getCellById(src)
          const targetNode = graph.getCellById(tgt)
          if (sourceNode?.isNode() && edge.getSourcePortId()) {
            syncNodePorts(sourceNode)
          }
          if (targetNode?.isNode() && edge.getTargetPortId()) {
            syncNodePorts(targetNode)
          }

          cbRef.current.onEdgeCreated({
            id: edge.id,
            sourceId: src,
            targetId: tgt,
            sourcePortId: edge.getSourcePortId() ?? undefined,
            targetPortId: edge.getTargetPortId() ?? undefined,
          })
        })

        graph.on('edge:removed', ({ edge }: { edge: Edge }) => {
          if (loadingGraphRef.current) return

          const sourceCellId = edge.getSourceCellId()
          const targetCellId = edge.getTargetCellId()

          if (sourceCellId) {
            const sourceNode = graph.getCellById(sourceCellId)
            if (sourceNode?.isNode()) syncNodePorts(sourceNode)
          }
          if (targetCellId) {
            const targetNode = graph.getCellById(targetCellId)
            if (targetNode?.isNode()) syncNodePorts(targetNode)
          }

          cbRef.current.onEdgeRemoved(edge.id)
        })

        graphRef.current = graph

        if (pendingGraphDataRef.current) {
          const pending = pendingGraphDataRef.current
          pendingGraphDataRef.current = null
          applyGraphData(graph, pending.nodes, pending.edges)
        }

        return graph
      }

      const observer = new ResizeObserver(() => {
        const { width, height } = container.getBoundingClientRect()
        if (width <= 0 || height <= 0) return

        if (graphRef.current) {
          graphRef.current.resize(width, height)
        } else {
          createGraph(width, height)
        }
      })
      observer.observe(container)
      window.requestAnimationFrame(() => {
        const { width, height } = container.getBoundingClientRect()
        if (width > 0 && height > 0 && !graphRef.current) {
          createGraph(width, height)
        }
      })

      return () => {
        if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
        observer.disconnect()
        graphRef.current?.dispose()
        graphRef.current = null
      }
    }, [applyGraphData, syncNodePorts])

    const addNode = useCallback((data: CanvasNodeData) => {
      const graph = graphRef.current
      if (!graph) return

      graph.getNodes().forEach((node) => node.removeTools())
      const node = graph.addNode({
        id: data.id,
        shape: CANVAS_NODE_SHAPE,
        primer: 'rect',
        x: data.positionX,
        y: data.positionY,
        width: NODE_W,
        height: NODE_H,
        data,
        ports: PORTS,
      })

      syncNodePorts(node)
    }, [syncNodePorts])

    const loadGraph = useCallback(
      (nodes: CanvasNodeData[], edges: CanvasEdgeData[]) => {
        const graph = graphRef.current
        if (!graph) {
          pendingGraphDataRef.current = { nodes, edges }
          return
        }

        applyGraphData(graph, nodes, edges)
      },
      [applyGraphData],
    )

    useEffect(() => {
      if (graphVersion <= 0) return
      if (lastAppliedVersionRef.current === graphVersion) return

      lastAppliedVersionRef.current = graphVersion
      loadGraph(initialNodes, initialEdges)
    }, [graphVersion, initialEdges, initialNodes, loadGraph])

    const removeNode = useCallback((id: string) => {
      const node = graphRef.current?.getCellById(id)
      if (!node) return

      programmaticRemovedNodeIdsRef.current.add(id)
      node.remove()
    }, [])

    const updateNode = useCallback((id: string, patch: Partial<CanvasNodeData>) => {
      const node = graphRef.current?.getCellById(id)
      if (!node) return
      node.setData({ ...(node.getData<CanvasNodeData>() ?? {}), ...patch }, { overwrite: true })
    }, [])

    const getNodeData = useCallback((id: string): CanvasNodeData | undefined => {
      return graphRef.current?.getCellById(id)?.getData<CanvasNodeData>()
    }, [])

    const getAllNodeData = useCallback((): CanvasNodeData[] => {
      return (graphRef.current?.getNodes() ?? []).map((node) => node.getData<CanvasNodeData>())
    }, [])

    const addEdge = useCallback((data: CanvasEdgeData) => {
      const graph = graphRef.current
      if (!graph) return
      if (graph.getCellById(data.id)) return
      graph.addEdge(buildEdge(data.sourceId, data.targetId, data.id, data.sourcePortId, data.targetPortId))
    }, [])

    const removeEdge = useCallback((id: string) => {
      graphRef.current?.removeCell(id)
    }, [])

    const selectNode = useCallback((id: string | null) => {
      const graph = graphRef.current
      if (!graph) return

      graph.getNodes().forEach((node) => node.removeTools())
      if (!id) return

      const node = graph.getCellById(id)
      if (!node) return

      node.addTools([
        {
          name: 'boundary',
          args: {
            padding: 4,
            attrs: {
              fill: 'none',
              stroke: '#378ADD',
              strokeWidth: 2,
              rx: 6,
            },
          },
        },
        {
          name: 'button-remove',
          args: {
            x: '100%',
            y: 0,
            offset: { x: 4, y: -4 },
          },
        },
      ])
    }, [])

    useImperativeHandle(
      ref,
      () => ({
        loadGraph,
        addNode,
        removeNode,
        updateNode,
        getNodeData,
        getAllNodeData,
        addEdge,
        removeEdge,
        selectNode,
      }),
      [loadGraph, addNode, removeNode, updateNode, getNodeData, getAllNodeData, addEdge, removeEdge, selectNode],
    )

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }, [])

    const handleDrop = useCallback(
      (e: React.DragEvent) => onDropFromTree(e),
      [onDropFromTree],
    )

    return (
      <div className="absolute inset-0 overflow-hidden">
        <div
          ref={containerRef}
          className="absolute inset-0"
          style={{ width: '100%', height: '100%' }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      </div>
    )
  },
)

X6Canvas.displayName = 'X6Canvas'

export default X6Canvas
