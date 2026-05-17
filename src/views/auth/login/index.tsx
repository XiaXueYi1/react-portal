import { useNavigate, useSearchParams } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { Alert, Button, Form, Input } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/store'
import type { LoginForm } from '../types'
import LoginApi from '../api'

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
        <main className="relative size-full min-h-screen overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-purple-50/30 via-40% to-cyan-50/40 to-90%">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(147,197,253,0.15),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(196,181,253,0.12),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_90%,rgba(165,243,252,0.1),transparent_50%)]" />
            </div>

            <section className="relative z-10 flex size-full min-h-screen items-center justify-center px-4">
                <div className="w-full max-w-md">
                    <div className="rounded-3xl border border-white/60 bg-white/70 p-8 shadow-2xl backdrop-blur-md">
                        <div className="mb-8 text-center">
                            <div className="mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                                <LockOutlined className="text-3xl text-white" />
                            </div>
                            <h1 className="mb-2 text-2xl text-gray-800">欢迎回来</h1>
                            <p className="text-sm text-gray-500">请登录您的账号</p>
                        </div>

                        {mutation.error && (
                            <Alert
                                message={mutation.error.message}
                                type="error"
                                showIcon
                                closable
                                className="mb-5"
                                onClose={() => mutation.reset()}
                            />
                        )}

                        <Form<LoginForm>
                            className="space-y-5"
                            initialValues={{ username: 'admin', password: '123456' }}
                            onFinish={(values) => mutation.mutate(values)}
                            autoComplete="off"
                            layout="vertical"
                        >
                            <div>
                                <label htmlFor="username" className="mb-2 block text-sm text-gray-700">
                                    用户名
                                </label>
                                <Form.Item
                                    name="username"
                                    rules={[{ required: true, message: '请输入用户名' }]}
                                    className="!mb-0"
                                >
                                    <Input
                                        id="username"
                                        size="large"
                                        prefix={<UserOutlined className="text-gray-400" />}
                                        placeholder="请输入用户名"
                                        className="!rounded-xl !border-gray-200/60 !bg-white/80 !py-2 !shadow-sm transition-all"
                                    />
                                </Form.Item>
                            </div>

                            <div>
                                <label htmlFor="password" className="mb-2 block text-sm text-gray-700">
                                    密码
                                </label>
                                <Form.Item
                                    name="password"
                                    rules={[{ required: true, message: '请输入密码' }]}
                                    className="!mb-0"
                                >
                                    <Input.Password
                                        id="password"
                                        size="large"
                                        prefix={<LockOutlined className="text-gray-400" />}
                                        placeholder="请输入密码"
                                        className="!rounded-xl !border-gray-200/60 !bg-white/80 !py-2 !shadow-sm transition-all"
                                    />
                                </Form.Item>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="group flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        className="size-4 cursor-pointer rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-400/40"
                                    />
                                    <span className="ml-2 text-gray-600 transition-colors group-hover:text-gray-800">
                                        记住我
                                    </span>
                                </label>
                                <button
                                    type="button"
                                    className="text-blue-500 transition-colors hover:text-blue-600"
                                >
                                    忘记密码？
                                </button>
                            </div>

                            <Button
                                htmlType="submit"
                                loading={mutation.isPending}
                                className="!h-auto !w-full !rounded-xl !border-0 !bg-gradient-to-r !from-blue-500 !to-cyan-500 !py-3.5 !text-white !shadow-lg transition-all duration-300 hover:!-translate-y-0.5 hover:!from-blue-600 hover:!to-cyan-600 hover:!shadow-xl"
                            >
                                登录
                            </Button>

                            <div className="pt-2 text-center text-sm text-gray-600">
                                还没有账号？
                                <button
                                    type="button"
                                    className="ml-1 text-blue-500 transition-colors hover:text-blue-600"
                                >
                                    立即注册
                                </button>
                            </div>
                        </Form>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default Login
