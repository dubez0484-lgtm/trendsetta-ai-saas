/**
 * Server-side helper for resolving the authenticated user. API routes
 * must always derive the user from the session — never trust a userId
 * supplied by the client in a request body or query string.
 */
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { ApiError } from '@/lib/errors/api-error';

export async function getCurrentUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    throw new ApiError('UNAUTHORIZED', 'You must be signed in to perform this action.');
  }

  return userId;
}
