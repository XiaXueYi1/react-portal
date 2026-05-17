import { useState, useEffect } from 'react'

/**
 * 防抖 —— 值在 delay ms 内不再变化时才更新
 * 为什么？——搜索框输入时避免频繁发请求，等用户停止输入后再触发
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value)
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])
    return debouncedValue
}
