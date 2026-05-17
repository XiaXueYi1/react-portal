import { memo, useState } from 'react'
import { Card as AntCard } from 'antd'

interface CardProps {
    text: string
}

/**
 * React.memo 包裹 —— props 不变时跳过渲染
 * 为什么？——父组件 state 变化时，子组件 props 没变就不需要重渲染
 *          这对于列表中的每一项尤其重要，避免整列表重渲染
 */
const CardItem = memo(function CardItem({ text }: CardProps) {
    const [count, setCount] = useState(0)

    return (
        <AntCard
            size="small"
            hoverable
            style={{ marginBottom: 8 }}
            onClick={() => setCount(c => c + 1)}
        >
            <span>{text}</span>
            <span style={{ marginLeft: 12, color: '#999' }}>
                点击次数: {count}
            </span>
        </AntCard>
    )
})

export default CardItem
