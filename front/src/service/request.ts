import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { accessTokenService } from './accessToken'
import type { ResponseTemplate } from '@/types'
import { authService } from './auth'
import router from '@/router'

enum REQUEST_METHOD {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
}

export const axiosInstance = axios.create({
  baseURL: 'http://localhost:1865',
  withCredentials: true,
})

export const requestService = {
  async makeRequest(method: REQUEST_METHOD, url: string, data?: { [index: string]: string }) {
    const requestConfig: AxiosRequestConfig = { headers: {} }

    requestConfig.url = url
    requestConfig.method = method.toLowerCase()

    const isAccessTokenSet = await setAccessToken(requestConfig)

    debugger
    // if (router.currentRoute.value.path !== '/auth') {
    //   router.push('/auth')
    // }

    if (!isAccessTokenSet) {
      return
    }

    switch (method) {
      case REQUEST_METHOD.GET:
        requestConfig['params'] = data
        break
      case REQUEST_METHOD.POST:
      case REQUEST_METHOD.PUT:
        requestConfig['data'] = data
        break
    }

    return axios(requestConfig)
      .then(async (response: AxiosResponse<ResponseTemplate<any>>) => {
        debugger
        return response.data
      })
      .catch(async (error: AxiosError<ResponseTemplate<any>>) => {
        debugger
        if (error.response) {
          // showNotification(
          //   response.response.config.url,
          //   response.response.data.message,
          //   'error',
          //   true,
          // )
        } else {
          console.log('А почему нет response???')
        }

        return error

        //throw new Error(error.response?.data.message)

        //return response.response?.data || {data: null, error: true, message: ''}
      })
  },

  async get(url: string, data = {}) {
    return this.makeRequest(REQUEST_METHOD.GET, url, data)
  },

  async post(url: string, data = {}) {
    return this.makeRequest(REQUEST_METHOD.POST, url, data)
  },

  async put(url: string, data = {}) {
    return this.makeRequest(REQUEST_METHOD.PUT, url, data)
  },
}

async function setAccessToken(config: AxiosRequestConfig) {
  debugger
  const accessToken = accessTokenService.get()
  const expired = accessTokenService.isExpired()

  if (accessToken && !expired) {
    config['headers']!.Authorization = accessToken.token
    return true
  } else if (accessToken && expired) {
    const accessToken = await authService.refreshAccessToken()

    if (accessToken) {
      accessTokenService.set(accessToken)
      config.headers!.Authorization = accessToken.token
      return true
    }
  }

  return false
}
