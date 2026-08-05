/**
 * Rate Limiter — Zerey Platform
 * Proteção contra Brute Force, Credential Stuffing e abuso de endpoints.
 * Implementação in-memory com sliding window.
 */

interface RateLimitEntry {
  count: number;
  firstRequest: number;
}

const store = new Map<string, RateLimitEntry>();

// Limpeza periódica a cada 5 minutos para evitar memory leak
const CLEANUP_INTERVAL = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.firstRequest > 15 * 60 * 1000) {
      store.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Verifica se um identificador (IP, email, etc.) excedeu o limite de requisições.
 * @param identifier - Chave única (ex: "login:192.168.1.1" ou "forgot:user@email.com")
 * @param limit - Número máximo de requisições permitidas na janela
 * @param windowMs - Duração da janela em milissegundos
 * @returns true se o limite foi excedido (deve bloquear), false se permitido
 */
export function isRateLimited(
  identifier: string,
  limit: number = 5,
  windowMs: number = 60 * 1000
): boolean {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now - entry.firstRequest > windowMs) {
    store.set(identifier, { count: 1, firstRequest: now });
    return false;
  }

  entry.count++;

  if (entry.count > limit) {
    return true; // BLOQUEADO
  }

  return false;
}

/**
 * Presets de rate limiting por tipo de operação
 */
export const RATE_LIMITS = {
  /** Login: 5 tentativas por minuto por IP */
  LOGIN: { limit: 5, windowMs: 60 * 1000 },
  /** Registro: 3 contas por hora por IP */
  REGISTER: { limit: 3, windowMs: 60 * 60 * 1000 },
  /** Forgot Password: 3 pedidos por hora por email */
  FORGOT_PASSWORD: { limit: 3, windowMs: 60 * 60 * 1000 },
  /** Reset Password: 5 tentativas por 15 minutos por token */
  RESET_PASSWORD: { limit: 5, windowMs: 15 * 60 * 1000 },
  /** API Sessions: 30 requisições por minuto por usuário */
  API_SESSIONS: { limit: 30, windowMs: 60 * 1000 },
} as const;
