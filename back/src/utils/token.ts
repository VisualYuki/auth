import jwt, { JwtPayload } from "jsonwebtoken";

export const ACCESS_TOKEN_SECRET = "access-secret-example";
export const REFRESH_TOKEN_SECRET = "refresh-secret-example";
export const ACCESS_TOKEN_EXPIRES_IN = 30;
export const REFRESH_TOKEN_EXPIRES_IN = 60;

export type Payload = { login: string };

type ReturnToken = {
  token: string;
  expiresAt: number;
}; //| null

export function generateToken(
  payload: Payload,
  secret: string,
  expiresIn: number
) {
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn,
  });
}

export function generateAccessToken(payload: Payload): ReturnToken {
  const token = generateToken(
    payload,
    ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRES_IN
  );

  return {
    token: token,
    expiresAt: Date.now() + ACCESS_TOKEN_EXPIRES_IN * 1000,
  };
}

export function generateRefreshToken(payload: Payload): ReturnToken {
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

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as JwtPayload;

    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return true;
    } else {
      return false;
    }
  } catch (err: unknown) {
    return true;
  }
}

export const tokenUtils = {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  isTokenExpired,
};
