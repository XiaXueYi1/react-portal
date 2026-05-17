import { useNavigate, useSearchParams } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { Form, Input, Button, Typography, Alert } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/store'
import type { LoginForm } from '../types'
import LoginApi from '../api'

const { Title, Text } = Typography
const LOGIN_BACKGROUND_IMAGE =
    'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=2200&q=85'

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
        <main
            className="relative min-h-screen overflow-hidden bg-neutral-950 text-white"
            style={{
                backgroundImage: `linear-gradient(180deg, rgba(3, 7, 18, 0.58) 0%, rgba(3, 7, 18, 0.9) 100%), url(${LOGIN_BACKGROUND_IMAGE})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(56,189,248,0.2),transparent_32%),linear-gradient(120deg,rgba(6,182,212,0.1),transparent_40%,rgba(99,102,241,0.12))]" />

            <section className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
                <div className="w-full max-w-[420px] rounded-[6px] border border-white/12 bg-neutral-950/55 p-7 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8">
                    <div className="mb-8 text-center">
                        <Text className="!mb-3 block !text-xs !font-semibold !uppercase !tracking-[0.24em] !text-cyan-200">
                            Frontend Portal
                        </Text>
                        <Title level={2} className="!mb-2 !text-white">
                            登录
                        </Title>
                        <Text className="!text-slate-300">使用工作台账号继续访问</Text>
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
                        initialValues={{ username: 'react', password: '123456' }}
                        onFinish={(values) => mutation.mutate(values)}
                        autoComplete="off"
                        size="large"
                        layout="vertical"
                    >
                        <Form.Item
                            name="username"
                            label={<span className="text-slate-200">用户名</span>}
                            rules={[{ required: true, message: '请输入用户名' }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label={<span className="text-slate-200">密码</span>}
                            rules={[{ required: true, message: '请输入密码' }]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
                        </Form.Item>

                        <Form.Item className="mb-0">
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                loading={mutation.isPending}
                            className="mt-2"
                        >
                            登录
                        </Button>
                        </Form.Item>
                    </Form>
                </div>
            </section>
        </main>
    )
}

export default Login
