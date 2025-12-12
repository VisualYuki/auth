import { tokenDatabase } from "../database/token";
import { Payload, REFRESH_TOKEN_EXPIRES_IN, tokenUtils } from "../utils/token";

export function generateAccessToken(payload: Payload) {
  return tokenUtils.generateAccessToken(payload);
}

export function generateRefreshToken(payload: Payload) {
  const token = tokenUtils.generateRefreshToken(payload);

  tokenDatabase.addRefreshToken(payload.login, token.token, token.expiresAt);

  return token;
}

export const tokenService = {
  generateAccessToken,
  generateRefreshToken,
};
