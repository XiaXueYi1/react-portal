export interface AppStoreState {
    // 布局模式
    layoutMode: 'top' | 'side'
    // 主题
    theme: string
    // 是否开启暗黑模式
    darkMode: boolean
    // 语言
    language: string
    // 顶部栏高度
    headerHeight: number
    // 侧边栏宽度
    sideWidth: number
}

export interface AppStore {
    appState: AppStoreState
    setAppState: (newState: Partial<AppStoreState>) => void
}