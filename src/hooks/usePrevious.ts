import { useRef, useEffect } from 'react'

/**
 * 保存上一次渲染时的值
 * 为什么？——需要对比 props/state 变化时（如判断某个值是否真的变了），
 *         用 ref 存储旧值不会触发额外渲染
 */
export function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T | undefined>(undefined)
    useEffect(() => {
        ref.current = value
    })
    return ref.current
}
