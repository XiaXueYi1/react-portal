import { useEffect, useState } from 'react'
import { Button, Drawer, Input, Popconfirm, Space, Tag } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import type { CanvasNodeData, NodeTemplate } from '../types'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../constants'

interface Props {
  open: boolean
  node: CanvasNodeData | null
  templates: NodeTemplate[]
  onClose: () => void
  onSave: (note: string) => void
  onDelete: (id: string) => void
}

interface ReadonlyFieldProps {
  label: string
  value?: string | number | null
}

function ReadonlyField({ label, value }: ReadonlyFieldProps) {
  return (
    <div>
      <label className="block text-sm text-gray-500 mb-1">{label}</label>
      <Input value={value ?? ''} readOnly />
    </div>
  )
}

function NodeDrawer({ open, node, templates, onClose, onSave, onDelete }: Props) {
  const [note, setNote] = useState('')
  const template = node ? templates.find((item) => item.id === node.templateId) : undefined

  useEffect(() => {
    setNote(node?.note ?? '')
  }, [node])

  const handleSave = () => {
    onSave(note)
    onClose()
  }

  return (
    <Drawer title="节点详情" open={open} onClose={onClose} closable mask={false}>
      {node && (
        <div className="flex flex-col gap-4">
          <ReadonlyField label="名称" value={node.label} />

          <div>
            <label className="block text-sm text-gray-500 mb-1">分类</label>
            <Tag color={CATEGORY_COLORS[node.category]}>{CATEGORY_LABELS[node.category]}</Tag>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">说明</label>
            <Input.TextArea value={node.description} readOnly rows={3} className="text-gray-500" />
          </div>

          <ReadonlyField label="推荐版本" value={template?.version ?? '-'} />

          <div>
            <label className="block text-sm text-gray-500 mb-1">备注</label>
            <Input.TextArea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="填写备注，点击保存画布后生效"
              rows={4}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex flex-col gap-1 text-xs text-gray-400">
              <span>
                位置：({node.positionX.toFixed(0)}, {node.positionY.toFixed(0)})
              </span>
              <span>ID: {node.id}</span>
            </div>
            <Popconfirm
              title="确定删除这个节点吗？"
              description="当前仅修改草稿，点击保存画布后生效"
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

          <div className="flex justify-end">
            <Space>
              <Button onClick={onClose}>取消</Button>
              <Button type="primary" onClick={handleSave}>
                应用备注
              </Button>
            </Space>
          </div>
        </div>
      )}
    </Drawer>
  )
}

export default NodeDrawer
