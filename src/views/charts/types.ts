import type { ReactNode } from 'react'

export interface DailyStatistic {
    date: string
    count: number
}

export interface StatisticResponse {
    startDate: string
    endDate: string
    total: number
    daily: DailyStatistic[]
}

export interface ChartPanelProps {
    title: string
    description: string
    color: string
    icon: ReactNode
    data?: StatisticResponse
    loading: boolean
}
