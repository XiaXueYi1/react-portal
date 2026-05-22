import { useCallback, useEffect, useState } from 'react'
import { Alert, message } from 'antd'
import { BarChartOutlined, MessageOutlined } from '@ant-design/icons'
import ChartPanel from './components/ChartPanel'
import StatisticsApi from './api'
import type { StatisticResponse } from './types'

export default function Charts() {
    const [canvasStats, setCanvasStats] = useState<StatisticResponse>()
    const [llmStats, setLlmStats] = useState<StatisticResponse>()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const loadStatistics = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const [canvasData, llmData] = await Promise.all([
                StatisticsApi.getCanvasStatistics(),
                StatisticsApi.getLlmStatistics(),
            ])
            setCanvasStats(canvasData)
            setLlmStats(llmData)
        } catch (requestError) {
            const errorMessage = requestError instanceof Error ? requestError.message : '加载统计数据失败'
            setError(errorMessage)
            message.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadStatistics()
    }, [loadStatistics])

    return (
        <div className="relative size-full overflow-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-purple-50/30 via-40% to-cyan-50/40 to-90%">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(147,197,253,0.15),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(196,181,253,0.12),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_90%,rgba(165,243,252,0.1),transparent_50%)]" />
            </div>

            <div className="relative z-10 flex min-h-full flex-col gap-6 px-4 py-5 sm:px-6 lg:h-full lg:min-h-[720px] lg:gap-8 lg:px-[10%] lg:py-8">
                {error ? (
                    <Alert
                        type="error"
                        showIcon
                        closable
                        message={error}
                        onClose={() => setError('')}
                    />
                ) : null}

                <ChartPanel
                    title="近期画布新增数"
                    description="统计最近自然日内新增的未删除画布"
                    color="#2563eb"
                    icon={<BarChartOutlined />}
                    data={canvasStats}
                    loading={loading}
                />

                <ChartPanel
                    title="近期 AI 对话次数"
                    description="统计用户发起的 LLM 消息数量"
                    color="#7c3aed"
                    icon={<MessageOutlined />}
                    data={llmStats}
                    loading={loading}
                />
            </div>
        </div>
    )
}
