import { accessTokenService } from '@/service/accessToken'
import axios from 'axios'

export const axiosInstance = axios.create({
  baseURL: 'http://localhost:1865',
  withCredentials: true,
})

axiosInstance.interceptors.request.use(async (config) => {
  const accessToken = accessTokenService.get()
  const expired = accessTokenService.isExpired()

  if (accessToken && !expired) {
    config['headers'].Authorization = accessToken.token
  } else if (accessToken && expired) {
    const response = await axiosInstance.post('/auth/refresh')

    if (response.data.accessToken) {
      accessTokenService.set(response.data.accessToken)
      config.headers.Authorization = response.data.accessToken.token
    }
  }

  return config
})
