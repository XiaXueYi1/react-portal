import request from './request'

export interface LoginParams {
    username: string
    password: string
}

export interface LoginResponse {
    id: string
    name: string
    avatar?: string
}

export interface AuthStatusResponse {
    authenticated: boolean
    username?: string | null
}

class AuthApi {
    static login(data: LoginParams) {
        return request.post<LoginResponse>('/auth/login', data)
    }

    static status() {
        return request.get<AuthStatusResponse>('/auth/status', { skipAuthRedirect: true })
    }
}

export default AuthApi
