import { Typography } from 'antd'
import { HomeOutlined } from '@ant-design/icons'

const { Title } = Typography

function Home() {
    return (
        <div className="flex-1 overflow-auto p-6">
            <Title level={4}>
                <HomeOutlined className="mr-2" />
                首页
            </Title>
            <p className="text-gray-500">欢迎使用 Interview React</p>
        </div>
    )
}

export default Home
