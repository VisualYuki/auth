import jwt from "jsonwebtoken";

export const ACCESS_TOKEN_SECRET = "access-secret-example";
export const REFRESH_TOKEN_SECRET = "refresh-secret-example";
export const ACCESS_TOKEN_EXPIRES_IN = 30;
export const REFRESH_TOKEN_EXPIRES_IN = 60;

export type Payload = { login: string };

export function generateToken(
  payload: Payload,
  secret: string,
  expiresIn: number
) {
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn,
  });
}

export function generateAccessToken(payload: Payload) {
  return {
    token: generateToken(payload, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRES_IN),
    expiresAt: Date.now() + ACCESS_TOKEN_EXPIRES_IN * 1000,
  };
}

export function generateRefreshToken(payload: Payload) {
  const token = generateToken(
    payload,
    REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRES_IN
  );

  return {
    token,
    expiresAt: Date.now() + REFRESH_TOKEN_EXPIRES_IN * 1000,
  };
}

export const tokenUtils = {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
};
