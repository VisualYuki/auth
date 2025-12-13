import jwt from "jsonwebtoken";

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

export async function isTokenExpired(token: string): Promise<boolean> {
  const result = await new Promise<boolean>((resolve) => {
    jwt.verify(token, REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        resolve(true);
      } else {
        if (decoded === undefined) {
          resolve(false);
        } else if (typeof decoded === "string") {
          resolve(false);
        } else {
          if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            resolve(true);
          } else {
            resolve(false);
          }
        }
      }
    });
  });

  return result;
}

export const tokenUtils = {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  isTokenExpired,
};
