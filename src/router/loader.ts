import { redirect } from "react-router"
import { useAuthStore } from '@/store/auth'

export const rootLoader = async ({ request }: { request: Request }) => {
    const { isLoggedIn } = useAuthStore.getState()

    if (!isLoggedIn) {
        const url = new URL(request.url)
        const redirectTo = url.pathname + url.search
        throw redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`)
    }

    return null
}
