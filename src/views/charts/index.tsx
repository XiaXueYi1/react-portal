import { Typography } from 'antd'
import { LayoutOutlined } from '@ant-design/icons'
import echarts from "@/plugin/echarts/index";
import { useLayoutEffect, useRef } from 'react';
const { Title } = Typography

function Charts() {
    const chartRef = useRef(null)
    let instanceRef = useRef<echarts.ECharts | null>(null)

    // 初始化图表
    useLayoutEffect(() => {
        if (chartRef.current) {
            instanceRef.current = echarts.init(chartRef.current)
            instanceRef.current.setOption({
                title: { text: 'ECharts 示例' },
                tooltip: {},
                xAxis: { data: ['A', 'B', 'C', 'D', 'E'] },
                yAxis: {},
                series: [{ type: 'bar', data: [5, 20, 36, 10, 10] }]
            })
        }
        return () => {
            instanceRef.current?.dispose()
            instanceRef.current = null
        }
    }, [])
    return (
        <div className="flex-1 overflow-auto p-6">
            <Title level={4}>
                <LayoutOutlined className="mr-2" />
                Charts
            </Title>
            <div ref={chartRef} style={{ width: '100%', height: '400px' }} />
        </div>
    )
}

export default Charts
