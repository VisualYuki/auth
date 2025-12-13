import { tokenDatabase } from "../database/token";
import { Payload, REFRESH_TOKEN_EXPIRES_IN, tokenUtils } from "../utils/token";

function generateAccessToken(payload: Payload) {
  return tokenUtils.generateAccessToken(payload);
}

function generateRefreshToken(payload: Payload) {
  const token = tokenUtils.generateRefreshToken(payload);

  tokenDatabase.addRefreshToken(payload.login, token.token, token.expiresAt);

  return token;
}

function isRefreshTokenExist(token: string) {
  const refreshToken = tokenDatabase.getRefreshSession(token);

  if (!refreshToken) {
    return false;
  }

  return true;
}

async function isRefreshTokenExpired(token: string) {
  const refreshSession = tokenDatabase.getRefreshSession(token);

  if (!refreshSession) return true;

  if (
    await tokenUtils.isTokenExpired(token, {
      login: refreshSession.userLogin,
    })
  ) {
    return true;
  } else {
    return false;
  }
}

export const tokenService = {
  generateAccessToken,
  generateRefreshToken,
  isRefreshTokenExist,
  isRefreshTokenExpired,
};
