import type { NodeCategory } from './types'

export const CATEGORY_COLORS: Record<NodeCategory, string> = {
  VUE: '#639922',
  REACT: '#378ADD',
  COMMON: '#EF9F27',
  PROJECT: '#7F77DD',
}

export const CATEGORY_LABELS: Record<NodeCategory, string> = {
  VUE: 'Vue',
  REACT: 'React',
  COMMON: 'Common',
  PROJECT: 'Project',
}

export const CANVAS_NODE_SHAPE = 'canvas-node'
export const CANVAS_NODE_REGISTRY_FLAG = '__canvas_node_shape_registered__'

export const NODE_W = 148
export const NODE_H = 52

export const PORT_RADIUS = 6
export const PORT_COLOR = '#999'
export const EDGE_COLOR = '#999'
export const EDGE_ROUTER = { name: 'manhattan', args: { padding: 20 } }
export const EDGE_CONNECTOR = { name: 'rounded', args: { radius: 8 } }

function portAttrs(color: string) {
  return {
    circle: {
      r: PORT_RADIUS,
      magnet: true,
      stroke: color,
      strokeWidth: 2,
      fill: '#ffffff',
    },
  }
}

export const PORTS = {
  groups: {
    top: {
      position: 'top',
      attrs: portAttrs(PORT_COLOR),
    },
    right: {
      position: 'right',
      attrs: portAttrs(PORT_COLOR),
    },
    bottom: {
      position: 'bottom',
      attrs: portAttrs(PORT_COLOR),
    },
    left: {
      position: 'left',
      attrs: portAttrs(PORT_COLOR),
    },
  },
  items: [
    { id: 'top', group: 'top' },
    { id: 'right', group: 'right' },
    { id: 'bottom', group: 'bottom' },
    { id: 'left', group: 'left' },
  ],
}
