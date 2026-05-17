export interface UserInfo {
    id: string
    name: string
    avatar?: string
}

export interface AuthState {
    userInfo: UserInfo | null
    isLoggedIn: boolean
    setUserInfo: (userInfo: UserInfo) => void
    clearAuth: () => void
}
