import axios from 'axios'
import { getErrorMessage } from 'common'

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
        config.headers['Content-Type'] = 'application/json'
    }
    return config
})

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            sessionStorage.removeItem('token')
        }

        if (error.response?.data?.errorCode) {
            const { errorCode, message } = error.response.data
            error.message = message || getErrorMessage({ errorCode })
        } else if (error.response?.data?.message) {
            error.message = error.response.data.message
        } else {
            error.message = getErrorMessage(error)
        }

        return Promise.reject(error)
    }
)

export default api