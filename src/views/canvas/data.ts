import type { NodeTemplate } from './types'

export const NODE_TEMPLATES: NodeTemplate[] = [
  { id: 'vue-1', name: 'Vue 3', category: 'VUE', description: 'Vue.js 渐进式 JavaScript 框架', version: '^3.4.0', sortOrder: 1 },
  { id: 'vue-2', name: 'Pinia', category: 'VUE', description: 'Vue 官方状态管理库', version: '^2.1.0', sortOrder: 2 },
  { id: 'vue-3', name: 'Vue Router', category: 'VUE', description: 'Vue 官方路由管理器', version: '^4.2.0', sortOrder: 3 },
  { id: 'vue-4', name: 'Element Plus', category: 'VUE', description: 'Vue 3 UI 组件库', version: '^2.6.0', sortOrder: 4 },
  { id: 'react-1', name: 'React 18', category: 'REACT', description: 'React 前端框架', version: '^18.2.0', sortOrder: 1 },
  { id: 'react-2', name: 'Redux', category: 'REACT', description: 'React 状态管理库', version: '^4.2.0', sortOrder: 2 },
  { id: 'react-3', name: 'React Router', category: 'REACT', description: 'React 路由管理库', version: '^6.0.0', sortOrder: 3 },
  { id: 'react-4', name: 'Ant Design', category: 'REACT', description: 'React UI 组件库', version: '^5.0.0', sortOrder: 4 },
  { id: 'common-1', name: 'Axios', category: 'COMMON', description: '基于 Promise 的 HTTP 客户端', version: '^1.6.0', sortOrder: 1 },
  { id: 'common-2', name: 'Lodash', category: 'COMMON', description: 'JavaScript 实用工具库', version: '^4.17.0', sortOrder: 2 },
  { id: 'common-3', name: 'Dayjs', category: 'COMMON', description: '轻量级日期处理库', version: '^1.11.0', sortOrder: 3 },
  { id: 'project-1', name: '项目管理', category: 'PROJECT', description: '项目的基本信息与备注', sortOrder: 0 },
]
