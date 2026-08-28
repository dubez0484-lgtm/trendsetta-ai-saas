/**
 * Consistent API error shape used across all /api routes and the MCP
 * server. Never leak internal stack traces in the response body — those
 * belong only in server logs (see lib/security/logger.ts).
 */
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'META_TOKEN_EXPIRED'
  | 'META_PERMISSION_ERROR'
  | 'META_RATE_LIMITED'
  | 'META_API_ERROR'
  | 'INVALID_SIGNATURE'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  META_TOKEN_EXPIRED: 409,
  META_PERMISSION_ERROR: 403,
  META_RATE_LIMITED: 429,
  META_API_ERROR: 502,
  INVALID_SIGNATURE: 401,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
  code: ApiErrorCode;
  details?: unknown;

  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }

  toResponse(): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: this.code,
          message: this.message,
          ...(this.details !== undefined ? { details: this.details } : {}),
        },
      },
      { status: STATUS_BY_CODE[this.code] },
    );
  }
}

interface PrismaLikeError {
  code?: string;
  clientVersion?: string;
}

/** Converts any thrown value into a safe JSON error response. */
export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return error.toResponse();
  }

  if (error instanceof ZodError) {
    return new ApiError('VALIDATION_ERROR', 'Request validation failed.', error.flatten()).toResponse();
  }

  // Prisma errors carry a `code` (e.g. P2021 "table does not exist", P1001
  // "can't reach database server") that's far more diagnostic than the
  // message alone — surface it without dumping the full error object,
  // which for connection-string parse failures can echo back the
  // connection string itself (credentials included).
  const prismaCode = (error as PrismaLikeError | undefined)?.code;

  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify({
      level: 'error',
      event: 'unhandled_api_error',
      timestamp: new Date().toISOString(),
      errorName: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      ...(prismaCode ? { prismaCode } : {}),
    }),
  );

  return new ApiError('INTERNAL_ERROR', 'An unexpected error occurred.').toResponse();
}
