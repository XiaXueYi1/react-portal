import request from '@/service/request'
import type { StatisticResponse } from './types'

class StatisticsApi {
    static getCanvasStatistics() {
        return request.get<StatisticResponse>('/canvas/statistics')
    }

    static getLlmStatistics() {
        return request.get<StatisticResponse>('/llm/statistics')
    }
}

export default StatisticsApi
