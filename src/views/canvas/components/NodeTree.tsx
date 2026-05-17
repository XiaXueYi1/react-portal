import React, { useMemo } from 'react'
import { Empty, Tree } from 'antd'
import type { TreeDataNode } from 'antd'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../constants'
import type { NodeCategory, DragNodeData, CanvasFramework, NodeTemplate } from '../types'

interface Props {
  framework: CanvasFramework
  templates: NodeTemplate[]
  loading?: boolean
}

function isDisabled(category: NodeCategory, framework: CanvasFramework) {
  if (!framework || category === 'COMMON' || category === 'PROJECT') return false
  return category.toUpperCase() !== framework.toUpperCase()
}

function handleDragStart(e: React.DragEvent, node: DragNodeData) {
  e.dataTransfer.setData('application/json', JSON.stringify(node))
  e.dataTransfer.effectAllowed = 'copy'
}

function ColorDot({ category }: { category: NodeCategory }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle shrink-0"
      style={{ backgroundColor: CATEGORY_COLORS[category] }}
    />
  )
}

function buildTreeData(templates: NodeTemplate[], framework: CanvasFramework): TreeDataNode[] {
  const grouped: Record<NodeCategory, NodeTemplate[]> = {
    VUE: [],
    REACT: [],
    COMMON: [],
    PROJECT: [],
  }
  for (const t of templates) {
    grouped[t.category].push(t)
  }

  const order: NodeCategory[] = ['VUE', 'REACT', 'COMMON', 'PROJECT']

  return order.map((cat) => {
    const items = grouped[cat].sort((a, b) => a.sortOrder - b.sortOrder)
    return {
      key: `cat-${cat}`,
      title: (
        <span className="text-xs font-semibold text-gray-400 tracking-wide">
          {CATEGORY_LABELS[cat]}
        </span>
      ),
      selectable: false,
      children: items.map((t) => {
        const disabled = isDisabled(t.category, framework)
        return {
          key: t.id,
          title: (
            <span
              draggable={!disabled}
              onDragStart={(e) =>
                handleDragStart(e, {
                  title: t.name,
                  key: t.id,
                  category: t.category,
                })
              }
              className={`inline-flex items-center py-0.5 ${disabled ? 'cursor-not-allowed opacity-35' : 'cursor-grab'}`}
            >
              <ColorDot category={t.category} />
              {t.name}
            </span>
          ),
          selectable: false,
          disabled,
        }
      }),
    }
  })
}

const NodeTree: React.FC<Props> = ({ framework, templates, loading }) => {
  const treeData = useMemo(() => buildTreeData(templates, framework), [framework, templates])

  if (!loading && templates.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无节点模板" />
  }

  return <Tree treeData={treeData} defaultExpandAll blockNode showIcon={false} />
}

export default NodeTree
