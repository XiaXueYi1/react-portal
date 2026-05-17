import React, { useMemo } from 'react'
import { Tree } from 'antd'
import type { TreeDataNode } from 'antd'
import { NODE_TEMPLATES } from '../data'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../constants'
import type { NodeCategory, DragNodeData } from '../types'

interface Props {
  framework: 'vue' | 'react' | null
}

function isDisabled(category: NodeCategory, framework: 'vue' | 'react' | null) {
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

function buildTreeData(framework: 'vue' | 'react' | null): TreeDataNode[] {
  const grouped: Record<NodeCategory, typeof NODE_TEMPLATES> = {
    VUE: [],
    REACT: [],
    COMMON: [],
    PROJECT: [],
  }
  for (const t of NODE_TEMPLATES) {
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

const NodeTree: React.FC<Props> = ({ framework }) => {
  const treeData = useMemo(() => buildTreeData(framework), [framework])

  return <Tree treeData={treeData} defaultExpandAll blockNode showIcon={false} />
}

export default NodeTree
