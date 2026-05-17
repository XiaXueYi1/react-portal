import type { ComponentType } from "react"
import { createBrowserRouter, redirect } from "react-router"
import AppLoadingPage from '@/components/AppLoadingPage'
import { rootLoader } from './loader'

function lazyComponent(
    importFn: () => Promise<{ default: ComponentType }>,
    extra?: Record<string, unknown>
) {
    return async () => {
        const module = await importFn()
        return { Component: module.default, ...extra }
    }
}

const router = createBrowserRouter([
    {
        path: "/",
        lazy: lazyComponent(() => import('@/layout/index.tsx'), { loader: rootLoader }),
        HydrateFallback: () => AppLoadingPage(),
        children: [
            {
                index: true,
                Component: () => null,
                loader: () => { throw redirect("/home") }
            },
            {
                path: "home",
                lazy: lazyComponent(() => import('@/views/home/index.tsx')),
            },
            {
                path: "canvas",
                lazy: lazyComponent(() => import('@/views/canvas/index.tsx')),
            },
            {
                path: "charts",
                lazy: lazyComponent(() => import('@/views/charts/index.tsx')),
            },
            {
                path: "chat",
                lazy: lazyComponent(() => import('@/views/llm/chat/index.tsx')),
            },
            {
                path: "*",
                lazy: lazyComponent(() => import('@/views/error/NotFound.tsx')),
            }
        ]
    },
    {
        path: "/login",
        HydrateFallback: () => AppLoadingPage(),
        lazy: lazyComponent(() => import('@/views/login/index.tsx')),
    },
])

export default router
