import { redirect } from "react-router"
import AuthApi from '@/views/auth/auth'
import { useAuthStore } from '@/store/auth'

export const rootLoader = async ({ request }: { request: Request }) => {
    const authStore = useAuthStore.getState()

    if (authStore.isLoggedIn) {
        return null
    }

    try {
        const status = await AuthApi.status()

        if (status.authenticated) {
            const username = status.username || 'unknown'
            authStore.setUserInfo({ id: username, name: username })
            return null
        }
    } catch {
        authStore.clearAuth()
    }

    const url = new URL(request.url)
    const redirectTo = url.pathname + url.search
    throw redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`)
}
