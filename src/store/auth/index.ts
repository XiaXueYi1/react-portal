import { create } from 'zustand'
import type { AuthState } from './types'

export const useAuthStore = create<AuthState>((set) => ({
    userInfo: null,
    isLoggedIn: false,
    setUserInfo: (userInfo) => set({ userInfo, isLoggedIn: true }),
    clearAuth: () => set({ userInfo: null, isLoggedIn: false }),
}))
