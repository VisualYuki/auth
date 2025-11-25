export type ResponseTemplate<T> = {
  data: T
  error: boolean
  message: string
}

export type ResponsePromise<T> = Promise<ResponseTemplate<T>>
