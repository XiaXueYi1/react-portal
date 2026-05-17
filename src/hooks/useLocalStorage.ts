import { useState, useCallback } from 'react'

/**
 * 将状态持久化到 localStorage
 * 为什么？——避免页面刷新后状态丢失，同时保持 React 响应式
 *          初始化时惰性读 localStorage，避免每次渲染都读
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch {
            return initialValue
        }
    })

    const setValue = useCallback((value: T | ((prev: T) => T)) => {
        setStoredValue(prev => {
            const nextValue = value instanceof Function ? value(prev) : value
            window.localStorage.setItem(key, JSON.stringify(nextValue))
            return nextValue
        })
    }, [key])

    return [storedValue, setValue] as const
}
