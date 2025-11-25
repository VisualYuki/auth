import jwt from "jsonwebtoken";
import { dbService } from "../database";

export const ACCESS_TOKEN_SECRET = "access-secret-example";
export const REFRESH_TOKEN_SECRET = "refresh-secret-example";
export const ACCESS_TOKEN_EXPIRES_IN = 30;
export const REFRESH_TOKEN_EXPIRES_IN = 60;

//export let refreshTokens: string[] = [];

export type Payload = { login: string };

export function generateAccessToken(payload: Payload) {
  return {
    token: jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    }),
    expiresAt: Date.now() + ACCESS_TOKEN_EXPIRES_IN * 1000,
  };
}

export async function generateRefreshToken(payload: Payload) {
  const token = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });

  dbService.addRefreshToken(
    payload.login,
    token,
    Date.now() + REFRESH_TOKEN_EXPIRES_IN * 1000
  );

  return token;
}
