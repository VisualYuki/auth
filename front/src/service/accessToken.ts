export type AccessToken = {
  token: string
  expiresAt: number
}

let accessToken: undefined | AccessToken
const SAFE_TIME = 1000 * 10

function set(token: AccessToken) {
  accessToken = token
}

function get(): AccessToken | undefined {
  return accessToken
}

function isExpired(): boolean {
  if (!accessToken) return true

  return accessToken.expiresAt < Date.now() - SAFE_TIME
}

export const accessTokenService = {
  set,
  get,
  isExpired,
}
