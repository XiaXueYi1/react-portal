import dayjs from 'dayjs'

const DATE_LABEL_FORMAT = 'MM/DD'
const DATE_RANGE_FORMAT = 'YYYY-MM-DD'

export function formatStatisticDateLabel(date: string) {
    const parsedDate = dayjs(date)
    return parsedDate.isValid() ? parsedDate.format(DATE_LABEL_FORMAT) : date
}

export function formatStatisticDateRange(startDate: string, endDate: string) {
    const start = dayjs(startDate)
    const end = dayjs(endDate)

    if (!start.isValid() || !end.isValid()) {
        return `${startDate} 至 ${endDate}`
    }

    return `${start.format(DATE_RANGE_FORMAT)} 至 ${end.format(DATE_RANGE_FORMAT)}`
}
