import { useEffect, useState } from 'react'
import { Drawer, Input, Tag, Button, Space, Popconfirm } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import type { CanvasNodeData, NodeTemplate } from '../types'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../constants'
import { NODE_TEMPLATES } from '../data'

interface Props {
  open: boolean
  node: CanvasNodeData | null
  onClose: () => void
  onSave: (label: string, note: string) => void
  onDelete: (id: string) => void
}

function NodeDrawer({ open, node, onClose, onSave, onDelete }: Props) {
  const [label, setLabel] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (node) {
      setLabel(node.label)
      setNote(node.note)
    }
  }, [node])

  const template: NodeTemplate | undefined = node
    ? NODE_TEMPLATES.find((t) => t.id === node.templateId)
    : undefined

  const handleSave = () => {
    if (!label.trim()) return
    onSave(label.trim(), note)
    onClose()
  }

  const handleClose = () => {
    if (node) {
      setLabel(node.label)
      setNote(node.note)
    }
    onClose()
  }

  return (
    <Drawer
      title="节点属性"
      open={open}
      onClose={handleClose}
      closable
      mask={false}
      extra={
        <Space>
          <Button onClick={handleClose}>取消</Button>
          <Button type="primary" onClick={handleSave} disabled={!label.trim()}>
            保存
          </Button>
        </Space>
      }
    >
      {node && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">名称</label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="节点名称" />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">分类</label>
            <Tag color={CATEGORY_COLORS[node.category]}>{CATEGORY_LABELS[node.category]}</Tag>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">说明</label>
            <Input.TextArea value={node.description} readOnly rows={3} className="text-gray-500" />
          </div>

          {template?.version && (
            <div>
              <label className="block text-sm text-gray-500 mb-1">推荐版本</label>
              <span className="text-sm">{template.version}</span>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-500 mb-1">备注</label>
            <Input.TextArea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="用户自定义备注（可选）"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex gap-4 text-xs text-gray-400">
              <span>位置: ({node.positionX.toFixed(0)}, {node.positionY.toFixed(0)})</span>
              <span>ID: {node.id}</span>
            </div>
            <Popconfirm
              title="确定删除此节点？"
              onConfirm={() => {
                onDelete(node.id)
                onClose()
              }}
            >
              <Button type="text" danger size="small" icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </div>
        </div>
      )}
    </Drawer>
  )
}

export default NodeDrawer
