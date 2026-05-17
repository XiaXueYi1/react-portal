import { create } from 'zustand'
import type { AppStore } from './types'

export const useAppStore = create<AppStore>((set) => ({
    appState: {
        layoutMode: 'top',
        theme: 'light',
        darkMode: false,
        language: 'zh-CN',
        headerHeight: 60,
        sideWidth: 240
    },
    setAppState: (newState) => set((state) => ({
        appState: { ...state.appState, ...newState }
    }))
}))
