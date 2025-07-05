import axios, { AxiosError } from 'axios'
import { ApiError } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Log API requests in development
    if (import.meta.env.VITE_DEV_MODE === 'true') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
    }
    
    // TODO: Add auth token when implemented
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log API responses in development
    if (import.meta.env.VITE_DEV_MODE === 'true') {
      console.log(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`)
    }
    return response
  },
  (error: AxiosError) => {
    console.error('API Error:', error)
    
    const apiError: ApiError = {
      message: 'エラーが発生しました',
      status: error.response?.status || 500,
    }

    // Handle network errors
    if (error.code === 'ERR_NETWORK') {
      apiError.message = 'バックエンドサーバーに接続できません。サーバーが起動しているか確認してください。'
      apiError.status = 0
    } else if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as any
      if (data.message) {
        apiError.message = data.message
      }
      if (data.errors) {
        apiError.errors = data.errors
      }
    }

    return Promise.reject(apiError)
  }
)