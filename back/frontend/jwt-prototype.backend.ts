/**
 * JWT Authentication Prototype (Backend)
 * 
 * Реализация согласно:
 * - RFC 7519: JSON Web Token (JWT)
 * - RFC 6750: The OAuth 2.0 Authorization Framework: Bearer Token Usage
 * 
 * Секция 5.1 RFC 7519 описывает структуру JWT Claims Set
 * RFC 6750 секция 2.1 описывает использование Bearer токенов в Authorization header
 */

import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// JWT Secret Keys (в продакшене должны быть в переменных окружения)
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "access-secret-example";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh-secret-example";

// Время жизни токенов
const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

// Хранилище refresh токенов (в продакшене использовать Redis или БД)
export const refreshTokens: string[] = [];

/**
 * JWT Payload структура согласно RFC 7519 Section 5.1
 * Reserved Claims (рекомендуемые):
 * - iss (issuer): эмитент токена
 * - sub (subject): субъект (пользователь)
 * - aud (audience): аудитория
 * - exp (expiration time): время истечения
 * - nbf (not before): не ранее
 * - iat (issued at): время выдачи
 * - jti (JWT ID): уникальный идентификатор токена
 */
export interface JWTPayload {
  // Reserved Claims (опциональные, но рекомендуемые)
  iss?: string;  // Issuer
  sub: string;   // Subject (login пользователя)
  aud?: string;  // Audience
  exp?: number;  // Expiration Time (автоматически добавляется jwt.sign)
  nbf?: number;  // Not Before
  iat?: number;  // Issued At (автоматически добавляется jwt.sign)
  jti?: string;  // JWT ID
  
  // Custom Claims (ваши данные)
  login: string;
  role?: string;
}

/**
 * Генерация Access Token
 * Согласно RFC 7519 - создает JWT с Claims Set
 */
export function generateAccessToken(payload: JWTPayload): string {
  const tokenPayload: JWTPayload = {
    iss: "your-auth-server",           // Issuer
    sub: payload.login,                // Subject
    aud: "your-api-server",            // Audience
    login: payload.login,
    role: payload.role || "user",
    // exp и iat добавляются автоматически через jwt.sign с expiresIn
  };

  // Создание JWT согласно RFC 7519
  return jwt.sign(tokenPayload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,  // Автоматически установит exp и iat
    algorithm: "HS256",                  // HMAC SHA-256 (согласно RFC 7518)
  });
}

/**
 * Генерация Refresh Token
 */
export function generateRefreshToken(payload: JWTPayload): string {
  const tokenPayload: JWTPayload = {
    iss: "your-auth-server",
    sub: payload.login,
    login: payload.login,
  };

  const token = jwt.sign(tokenPayload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    algorithm: "HS256",
  });

  // Сохраняем refresh token в хранилище
  refreshTokens.push(token);
  return token;
}

/**
 * Middleware для проверки Bearer токена
 * Согласно RFC 6750 Section 2.1: Authorization Request Header Field
 * 
 * Формат: Authorization: Bearer <token>
 */
export function authenticateToken(
  req: Request & { user?: JWTPayload },
  res: Response,
  next: NextFunction
): void {
  // RFC 6750 Section 2.1: получение токена из заголовка Authorization
  const authHeader = req.headers["authorization"];
  
  if (!authHeader) {
    res.status(401).json({ 
      error: "invalid_request",
      error_description: "Missing Authorization header" 
    });
    return;
  }

  // RFC 6750: формат "Bearer <token>"
  const parts = authHeader.split(" ");
  
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({ 
      error: "invalid_request",
      error_description: "Invalid Authorization header format. Expected: Bearer <token>" 
    });
    return;
  }

  const token = parts[1];

  // Верификация JWT согласно RFC 7519
  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      // RFC 6750 Section 3: Error Response
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ 
          error: "invalid_token",
          error_description: "The access token expired" 
        });
      }
      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ 
          error: "invalid_token",
          error_description: "The access token is invalid" 
        });
      }
      
      return res.status(401).json({ 
        error: "invalid_token",
        error_description: err.message 
      });
    }

    // Устанавливаем расшифрованные данные пользователя
    req.user = decoded as JWTPayload;
    next();
  });
}

/**
 * Защищенный endpoint пример
 */
export function protectedEndpointHandler(
  req: Request & { user?: JWTPayload },
  res: Response
): void {
  // req.user уже установлен middleware authenticateToken
  res.json({
    message: "This is a protected resource",
    user: {
      login: req.user?.login,
      sub: req.user?.sub,
      role: req.user?.role,
    },
  });
}

/**
 * Endpoint для обновления токена (Refresh Token)
 * Согласно RFC 6750
 */
export function refreshTokenHandler(
  req: Request<{}, any, { refreshToken: string }>,
  res: Response
): void {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      error: "invalid_request",
      error_description: "refresh_token is required",
    });
  }

  // Проверяем, что refresh token есть в хранилище
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json({
      error: "invalid_token",
      error_description: "refresh_token is invalid or revoked",
    });
  }

  // Верификация refresh token
  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        error: "invalid_token",
        error_description: "refresh_token is invalid or expired",
      });
    }

    const payload = decoded as JWTPayload;
    
    // Генерируем новый access token
    const newAccessToken = generateAccessToken({
      login: payload.login,
      sub: payload.login,
      role: payload.role,
    });

    res.json({
      access_token: newAccessToken,  // RFC 6750: snake_case для совместимости
      token_type: "Bearer",
      expires_in: 900,  // 15 минут в секундах
    });
  });
}
