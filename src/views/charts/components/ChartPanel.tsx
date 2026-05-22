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
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/70 text-xl shadow-sm" style={{ color }}>
                        {icon}
                    </span>
                    <div className="min-w-0">
                        <h2 className="m-0 text-xl font-semibold text-gray-700/90 sm:text-2xl">{title}</h2>
                        <p className="m-0 mt-1 text-sm text-gray-500">{description}</p>
                    </div>
                </div>
                <div className="text-left sm:text-right">
                    <div className="text-2xl font-semibold text-gray-800 sm:text-3xl">{data?.total ?? 0}</div>
                    <div className="text-xs text-gray-500">
                        {data ? formatStatisticDateRange(data.startDate, data.endDate) : '最近 7 天'}
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 rounded-2xl border border-white/60 bg-white/75 p-3 shadow-xl backdrop-blur-md sm:rounded-3xl sm:p-6">
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
