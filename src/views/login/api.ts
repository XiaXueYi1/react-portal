import request from '@/service/request'
import type { LoginForm, LoginResponse } from './types'

class LoginApi {
    static login(data: LoginForm) {
        return request.post<LoginResponse>('/auth/login', data)
    }
}

export default LoginApi
