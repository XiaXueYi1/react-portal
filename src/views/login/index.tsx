import { useNavigate, useSearchParams } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { Form, Input, Button, Card, Typography, Alert } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/store'
import type { LoginForm } from './types'
import LoginApi from './api'

const { Title, Text } = Typography

function Login() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { setUserInfo } = useAuthStore()
    const redirectTo = searchParams.get('redirect') || '/home'

    const mutation = useMutation({
        mutationFn: LoginApi.login,
        onSuccess: (data) => {
            setUserInfo({ id: data.id, name: data.name, avatar: data.avatar })
            navigate(redirectTo, { replace: true })
        },
    })

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-100 shadow-md">
                <div className="text-center mb-6">
                    <Title level={3}>Frontend-Portal</Title>
                    <Text type="secondary">登录以继续</Text>
                </div>

                {mutation.error && (
                    <Alert
                        message={mutation.error.message}
                        type="error"
                        showIcon
                        closable
                        className="mb-4"
                        onClose={() => mutation.reset()}
                    />
                )}

                <Form<LoginForm>
                    initialValues={{ username: 'react', password: '123456' }}  // 设置默认值
                    onFinish={(values) => mutation.mutate(values)}
                    autoComplete="off"
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: '请输入用户名' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="用户名" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: '请输入密码' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                    </Form.Item>

                    <Form.Item className="mb-0">
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={mutation.isPending}
                        >
                            登录
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    )
}

export default Login
