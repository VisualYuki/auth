/**
 * JWT Authentication Prototype (Frontend)
 *
 * Реализация согласно:
 * - RFC 7519: JSON Web Token (JWT)
 * - RFC 6750: The OAuth 2.0 Authorization Framework: Bearer Token Usage
 *
 * RFC 6750 Section 2.1: Authorization Request Header Field
 * Формат: Authorization: Bearer <token>
 */

const API_BASE_URL = "http://localhost:1865";

// Хранилище токенов (в продакшене использовать httpOnly cookies или secure storage)
class TokenStorage {
  private static ACCESS_TOKEN_KEY = "access_token";
  private static REFRESH_TOKEN_KEY = "refresh_token";

  static setAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
}

/**
 * HTTP клиент с автоматической подстановкой Bearer токена
 * Согласно RFC 6750 Section 2.1
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = TokenStorage.getAccessToken();

  // RFC 6750 Section 2.1: Authorization: Bearer <token>
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Обработка 401 - токен истек или невалиден
  if (response.status === 401) {
    // Попытка обновить токен через refresh token
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      // Повторяем запрос с новым токеном
      const newToken = TokenStorage.getAccessToken();
      if (newToken) {
        headers.set("Authorization", `Bearer ${newToken}`);
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });

        if (!retryResponse.ok) {
          throw new Error(`HTTP error! status: ${retryResponse.status}`);
        }

        return retryResponse.json();
      }
    }

    // Если refresh не удался - редирект на логин
    TokenStorage.clearTokens();
    window.location.href = "/login";
    throw new Error("Authentication failed");
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Unknown error" }));
    throw new Error(
      error.error_description ||
        error.message ||
        `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
}

/**
 * Авторизация (получение токенов)
 */
export async function login(login: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ login, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  const data = await response.json();

  // Сохраняем токены
  TokenStorage.setAccessToken(data.accessToken);
  TokenStorage.setRefreshToken(data.refreshToken);
}

/**
 * Обновление Access Token через Refresh Token
 * Согласно RFC 6750
 */
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = TokenStorage.getRefreshToken();

  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      TokenStorage.clearTokens();
      return false;
    }

    const data = await response.json();
    TokenStorage.setAccessToken(data.access_token || data.token);
    return true;
  } catch (error) {
    TokenStorage.clearTokens();
    return false;
  }
}

/**
 * Выход (logout)
 */
export async function logout(): Promise<void> {
  const refreshToken = TokenStorage.getRefreshToken();

  if (refreshToken) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: refreshToken }),
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  TokenStorage.clearTokens();
}

/**
 * Запрос к защищенному ресурсу
 * Автоматически добавляет Bearer токен согласно RFC 6750
 */
export async function getProtectedData(): Promise<any> {
  return apiRequest("/protected", {
    method: "POST",
  });
}

/**
 * Декодирование JWT токена (без верификации)
 * Для отладки - видеть содержимое токена
 */
export function decodeJWT(token: string): any {
  try {
    // JWT состоит из 3 частей, разделенных точкой: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    // Декодируем payload (вторая часть)
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}

/**
 * Пример использования
 */
export async function exampleUsage(): Promise<void> {
  try {
    // 1. Авторизация
    await login("demo", "demo");
    console.log("Login successful");

    // 2. Доступ к защищенному ресурсу
    const protectedData = await getProtectedData();
    console.log("Protected data:", protectedData);

    // 3. Просмотр содержимого токена
    const token = TokenStorage.getAccessToken();
    if (token) {
      const decoded = decodeJWT(token);
      console.log("Token payload:", decoded);
      console.log("Token expires at:", new Date(decoded.exp * 1000));
    }

    // 4. Выход
    await logout();
    console.log("Logout successful");
  } catch (error) {
    console.error("Error:", error);
  }
}

// Использование в React/Vue/Angular компоненте:
/*
import { login, getProtectedData, logout } from './jwt-prototype.frontend';

// В компоненте
const handleLogin = async () => {
  try {
    await login("user@example.com", "password123");
    const data = await getProtectedData();
    console.log(data);
  } catch (error) {
    console.error("Login failed:", error);
  }
};
*/
