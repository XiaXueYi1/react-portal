import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

export interface ApiEnvelope<T> {
    code: number
    message: string
    data: T
}

const API_PREFIX = import.meta.env.VITE_BASE_URL || '/api'

const instance = axios.create({
    baseURL: API_PREFIX,
    timeout: 10000,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
})

instance.interceptors.request.use((config) => {
    console.log('[api request]', config, config.baseURL, config.url, config.withCredentials)
    return config
})

instance.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || error.message || 'Request failed'
        return Promise.reject(new Error(Array.isArray(message) ? message[0] : message))
    },
)

export function resolveApiUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${API_PREFIX}${normalizedPath}`
}

function unwrapResponseData<T>(payload: ApiEnvelope<T> | T): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        const maybeEnvelope = payload as ApiEnvelope<T> | { data: T }
        return maybeEnvelope.data
    }

    return payload as T
}

async function get<T>(url: string, config?: AxiosRequestConfig) {
    const res = await instance.get<ApiEnvelope<T> | T>(url, config)
    return unwrapResponseData(res.data)
}

async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    const res = await instance.post<ApiEnvelope<T> | T>(url, data, config)
    return unwrapResponseData(res.data)
}

async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    const res = await instance.put<ApiEnvelope<T> | T>(url, data, config)
    return unwrapResponseData(res.data)
}

async function del<T>(url: string, config?: AxiosRequestConfig) {
    const res = await instance.delete<ApiEnvelope<T> | T>(url, config)
    return unwrapResponseData(res.data)
}

const request = { get, post, put, delete: del }

export default request
