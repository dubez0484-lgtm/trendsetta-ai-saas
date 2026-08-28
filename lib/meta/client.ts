/**
 * Low-level Meta Graph API client. All HTTP communication with Meta must
 * go through this module — no other file should call `fetch` against
 * graph.facebook.com directly. This keeps error handling, the API
 * version, and rate-limit/permission classification in one place.
 */
import { logger } from '@/lib/security/logger';

export type MetaApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: MetaApiError };

export interface MetaApiError {
  code: 'TOKEN_EXPIRED' | 'PERMISSION_ERROR' | 'RATE_LIMITED' | 'INVALID_REQUEST' | 'API_ERROR' | 'NETWORK_ERROR';
  message: string;
  metaErrorCode?: number;
  metaErrorSubcode?: number;
}

// Verified against secondary sources as of 2026-08-26 (direct fetch to
// developers.facebook.com is blocked in this build environment — this
// value has NOT been confirmed against Meta's primary changelog and MUST
// be re-verified in the App Dashboard / at
// https://developers.facebook.com/docs/graph-api/changelog before
// deploying). Always overridable via META_GRAPH_API_VERSION — never
// change this fallback without updating that comment.
const DEFAULT_GRAPH_VERSION = 'v25.0';

export function getGraphApiVersion(): string {
  return process.env.META_GRAPH_API_VERSION || DEFAULT_GRAPH_VERSION;
}

export function getGraphApiBaseUrl(): string {
  return `https://graph.facebook.com/${getGraphApiVersion()}`;
}

interface MetaGraphErrorBody {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

function classifyMetaError(status: number, body: MetaGraphErrorBody | undefined): MetaApiError {
  const err = body?.error;
  const message = err?.message || `Meta Graph API request failed with status ${status}.`;

  // OAuthException with code 190 = expired/invalid token.
  if (err?.code === 190) {
    return { code: 'TOKEN_EXPIRED', message, metaErrorCode: err.code, metaErrorSubcode: err.error_subcode };
  }

  // Permission-related errors.
  if (err?.code === 10 || err?.code === 200 || err?.code === 803) {
    return { code: 'PERMISSION_ERROR', message, metaErrorCode: err.code, metaErrorSubcode: err.error_subcode };
  }

  // Rate limiting.
  if (status === 429 || err?.code === 4 || err?.code === 17 || err?.code === 32) {
    return { code: 'RATE_LIMITED', message, metaErrorCode: err?.code, metaErrorSubcode: err?.error_subcode };
  }

  if (status >= 400 && status < 500) {
    return { code: 'INVALID_REQUEST', message, metaErrorCode: err?.code, metaErrorSubcode: err?.error_subcode };
  }

  return { code: 'API_ERROR', message, metaErrorCode: err?.code, metaErrorSubcode: err?.error_subcode };
}

interface GraphRequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  accessToken: string;
  params?: Record<string, string | number | boolean | undefined>;
  body?: Record<string, unknown>;
}

/**
 * Executes a request against the Meta Graph API and normalizes the result.
 * Never throws for expected Meta error responses — callers get a
 * structured { success: false, error } instead so they can branch on
 * error.code without try/catch everywhere.
 */
export async function graphRequest<T>(path: string, options: GraphRequestOptions): Promise<MetaApiResult<T>> {
  const { method = 'GET', accessToken, params = {}, body } = options;

  const url = new URL(`${getGraphApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  if (method === 'GET') {
    url.searchParams.set('access_token', accessToken);
  }

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: { 'Content-Type': 'application/json' },
      body:
        method === 'POST'
          ? JSON.stringify({ ...(body || {}), access_token: accessToken })
          : undefined,
      cache: 'no-store',
    });

    const text = await response.text();
    let parsed: unknown = undefined;
    try {
      parsed = text ? JSON.parse(text) : undefined;
    } catch {
      // Non-JSON response body; fall through to error handling below.
    }

    if (!response.ok) {
      const classified = classifyMetaError(response.status, parsed as MetaGraphErrorBody);
      logger.warn('meta_graph_api_error', {
        path,
        method,
        status: response.status,
        errorCode: classified.code,
        metaErrorCode: classified.metaErrorCode,
      });
      return { success: false, error: classified };
    }

    return { success: true, data: parsed as T };
  } catch (networkError) {
    logger.error('meta_graph_api_network_error', {
      path,
      method,
      message: networkError instanceof Error ? networkError.message : String(networkError),
    });
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: networkError instanceof Error ? networkError.message : 'Network request to Meta failed.',
      },
    };
  }
}

export function isMockMetaMode(): boolean {
  return process.env.MOCK_META === 'true';
}
