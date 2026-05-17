import { useEffect, useMemo, useRef } from 'react'
import { Skeleton } from 'antd'
import type { EChartsCoreOption } from 'echarts/core'
import echarts from '@/plugin/echarts'
import { formatStatisticDateLabel, formatStatisticDateRange } from '@/utils/date'
import type { ChartPanelProps } from '../types'

function ChartPanel({ title, description, color, icon, data, loading }: ChartPanelProps) {
    const chartRef = useRef<HTMLDivElement | null>(null)
    const chartInstanceRef = useRef<ReturnType<typeof echarts.init> | null>(null)

    const option = useMemo<EChartsCoreOption>(() => {
        const daily = data?.daily ?? []

        return {
            grid: {
                left: 42,
                right: 18,
                top: 24,
                bottom: 34,
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: (params: unknown) => {
                    const item = Array.isArray(params)
                        ? params[0] as { axisValue?: string; value?: number }
                        : null
                    return item ? `${item.axisValue}<br />数量：${item.value ?? 0}` : ''
                },
            },
            xAxis: {
                type: 'category',
                data: daily.map((item) => formatStatisticDateLabel(item.date)),
                axisTick: { show: false },
                axisLine: { lineStyle: { color: 'rgba(100,116,139,0.28)' } },
                axisLabel: { color: '#64748b' },
            },
            yAxis: {
                type: 'value',
                minInterval: 1,
                splitLine: { lineStyle: { color: 'rgba(148,163,184,0.18)' } },
                axisLabel: { color: '#64748b' },
            },
            series: [
                {
                    type: 'bar',
                    data: daily.map((item) => item.count),
                    barWidth: 34,
                    itemStyle: {
                        color,
                        borderRadius: [8, 8, 0, 0],
                    },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 16,
                            shadowColor: `${color}55`,
                        },
                    },
                },
            ],
        }
    }, [color, data])

    useEffect(() => {
        if (!chartRef.current || loading || !data) return

        const chart = chartInstanceRef.current ?? echarts.init(chartRef.current)
        chartInstanceRef.current = chart
        chart.setOption(option, true)

        const handleResize = () => chart.resize()
        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [data, loading, option])

    useEffect(() => {
        return () => {
            chartInstanceRef.current?.dispose()
            chartInstanceRef.current = null
        }
    }, [])

    return (
        <section className="flex min-h-0 flex-1 flex-col">
            <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-white/70 text-xl shadow-sm" style={{ color }}>
                        {icon}
                    </span>
                    <div>
                        <h2 className="m-0 text-2xl text-gray-700/90">{title}</h2>
                        <p className="m-0 mt-1 text-sm text-gray-500">{description}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-semibold text-gray-800">{data?.total ?? 0}</div>
                    <div className="text-xs text-gray-500">
                        {data ? formatStatisticDateRange(data.startDate, data.endDate) : '最近 7 天'}
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 rounded-3xl border border-white/60 bg-white/70 p-6 shadow-xl backdrop-blur-md">
                {loading ? (
                    <Skeleton active paragraph={{ rows: 6 }} />
                ) : data ? (
                    <div ref={chartRef} className="h-full min-h-[220px] w-full" />
                ) : (
                    <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-gray-400">
                        暂无统计数据
                    </div>
                )}
            </div>
        </section>
    )
}

export default ChartPanel
