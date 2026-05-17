import AuthApi from '@/service/auth'
import type { LoginForm, LoginResponse } from './types'

class LoginApi {
    static login(data: LoginForm) {
        return AuthApi.login(data) as Promise<LoginResponse>
    }
}

export default LoginApi
