/**
 * Structured server-side logger with automatic redaction of sensitive keys.
 * Never pass raw tokens/secrets as top-level string messages — always pass
 * them inside `meta` so the redactor can strip them.
 */

const SENSITIVE_KEYS = new Set([
  'accesstoken',
  'refreshtoken',
  'access_token',
  'refresh_token',
  'appsecret',
  'app_secret',
  'clientsecret',
  'client_secret',
  'password',
  'passwordhash',
  'token',
  'tokenencryptionkey',
  'encryptionkey',
  'authorization',
  'mcpauthtoken',
  'apikey',
  'api_key',
  'keyhash',
]);

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : redact(val);
    }
    return out;
  }
  return value;
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function emit(level: LogLevel, event: string, meta?: Record<string, unknown>) {
  const line = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...(meta ? { meta: redact(meta) } : {}),
  };

  const serialized = JSON.stringify(line);
  if (level === 'error') {
    // eslint-disable-next-line no-console
    console.error(serialized);
  } else if (level === 'warn') {
    // eslint-disable-next-line no-console
    console.warn(serialized);
  } else {
    // eslint-disable-next-line no-console
    console.log(serialized);
  }
}

export const logger = {
  info: (event: string, meta?: Record<string, unknown>) => emit('info', event, meta),
  warn: (event: string, meta?: Record<string, unknown>) => emit('warn', event, meta),
  error: (event: string, meta?: Record<string, unknown>) => emit('error', event, meta),
  debug: (event: string, meta?: Record<string, unknown>) => emit('debug', event, meta),
};
