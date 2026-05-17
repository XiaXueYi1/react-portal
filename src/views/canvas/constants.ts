import type { NodeCategory } from './types'

export const CATEGORY_COLORS: Record<NodeCategory, string> = {
  VUE: '#639922',
  REACT: '#378ADD',
  COMMON: '#EF9F27',
  PROJECT: '#7F77DD',
}

export const CATEGORY_LABELS: Record<NodeCategory, string> = {
  VUE: 'Vue 生态',
  REACT: 'React 生态',
  COMMON: '公共库',
  PROJECT: '项目管理',
}
