import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from "react-router"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import router from "@/router"
import { useAppStore } from '@/store'
import '@/styles/index.css'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 0,
        },
    },
})

function AppProviders() {
    const darkMode = useAppStore((state) => state.appState.darkMode)

    return (
        <ConfigProvider
            locale={zhCN}
            theme={{
                algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
            }}
        >
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </ConfigProvider>
    )
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AppProviders />
    </StrictMode>
)
