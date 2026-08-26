/**
 * MCP authorization layer. For initial deployment, a single shared
 * MCP_AUTH_TOKEN grants access, scoped to one designated user
 * (MCP_AUTH_USER_EMAIL) — there is no multi-tenant MCP client yet.
 *
 * The McpApiKey table (prisma/schema.prisma) already exists so this can
 * grow into real per-user API keys without a schema change: a bearer
 * token that matches a hashed row in McpApiKey resolves directly to that
 * row's user, independent of MCP_AUTH_TOKEN/MCP_AUTH_USER_EMAIL.
 */
import { createHash, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/db/prisma';

export class McpAuthError extends Error {}

function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export interface McpAuthContext {
  userId: string;
}

function extractBearerToken(authorizationHeader: string | undefined | null): string | null {
  if (!authorizationHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
  return match ? match[1]!.trim() : null;
}

/**
 * Validates the Authorization header on an MCP request and resolves the
 * user whose data the request is authorized to read/write. Throws
 * McpAuthError on any failure — callers must reject the request (401)
 * rather than falling back to an unauthenticated/default user.
 */
export async function resolveMcpAuthContext(authorizationHeader: string | undefined | null): Promise<McpAuthContext> {
  const token = extractBearerToken(authorizationHeader);
  if (!token) {
    throw new McpAuthError('Missing or malformed Authorization header. Expected "Bearer <token>".');
  }

  // Path 1: per-user API key (McpApiKey.keyHash).
  const keyHash = hashApiKey(token);
  const apiKey = await prisma.mcpApiKey.findUnique({ where: { keyHash } });
  if (apiKey && !apiKey.revokedAt) {
    await prisma.mcpApiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {
      // Best-effort telemetry; never block a valid request on this write.
    });
    return { userId: apiKey.userId };
  }

  // Path 2: shared MCP_AUTH_TOKEN for initial single-tenant deployment.
  const sharedToken = process.env.MCP_AUTH_TOKEN;
  const boundUserEmail = process.env.MCP_AUTH_USER_EMAIL;

  if (sharedToken && boundUserEmail && safeEqual(token, sharedToken)) {
    const user = await prisma.user.findUnique({ where: { email: boundUserEmail.toLowerCase() } });
    if (!user) {
      throw new McpAuthError(
        `MCP_AUTH_TOKEN is valid but MCP_AUTH_USER_EMAIL ("${boundUserEmail}") does not match any user.`,
      );
    }
    return { userId: user.id };
  }

  throw new McpAuthError('Invalid MCP authorization token.');
}
