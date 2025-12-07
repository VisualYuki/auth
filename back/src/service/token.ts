import { tokenDatabase } from "../database/token";
import { Payload, REFRESH_TOKEN_EXPIRES_IN, tokenUtils } from "../utils/token";

export function generateAccessToken(payload: Payload) {
  return tokenUtils.generateAccessToken(payload);
}

export function generateRefreshToken(payload: Payload) {
  const token = tokenUtils.generateRefreshToken(payload);

  // tokenDatabase.addRefreshToken(
  //   payload.login,
  //   token.token,
  //   Date.now() + REFRESH_TOKEN_EXPIRES_IN * 1000
  // );

  return token;
}

export const tokenService = {
  generateAccessToken,
  generateRefreshToken,
};
