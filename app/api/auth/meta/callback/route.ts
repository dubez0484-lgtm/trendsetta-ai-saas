/**
 * Step 2 of the Meta OAuth flow: validate state, exchange the code for a
 * long-lived token, discover the user's Pages and linked Instagram
 * business accounts, and persist them as SocialAccount rows.
 *
 * Meta → OAuth callback → exchange token → discover pages → discover
 * Instagram business accounts → save SocialAccount → redirect dashboard.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth/session';
import { logger } from '@/lib/security/logger';
import {
  discoverPagesAndInstagramAccounts,
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  persistDiscoveredAccounts,
} from '@/lib/meta/oauth';
import { META_OAUTH_STATE_COOKIE } from '@/app/api/auth/meta/route';

export const dynamic = 'force-dynamic';

function redirectWithError(request: NextRequest, reason: string) {
  const url = new URL('/dashboard/accounts', request.url);
  url.searchParams.set('error', reason);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  let userId: string;
  try {
    userId = await getCurrentUserId();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const searchParams = request.nextUrl.searchParams;
  const metaError = searchParams.get('error');
  if (metaError) {
    logger.warn('meta_oauth_denied', { metaError });
    return redirectWithError(request, 'meta_authorization_denied');
  }

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const cookieState = request.cookies.get(META_OAUTH_STATE_COOKIE)?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    logger.warn('meta_oauth_state_mismatch');
    return redirectWithError(request, 'invalid_oauth_state');
  }

  try {
    const shortLived = await exchangeCodeForToken(code);
    const longLived = await exchangeForLongLivedToken(shortLived.access_token);
    const pages = await discoverPagesAndInstagramAccounts(longLived.access_token);
    await persistDiscoveredAccounts(userId, pages);

    const response = NextResponse.redirect(new URL('/dashboard/accounts?connected=1', request.url));
    response.cookies.delete(META_OAUTH_STATE_COOKIE);
    return response;
  } catch (error) {
    logger.error('meta_oauth_callback_failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    const response = redirectWithError(request, 'connection_failed');
    response.cookies.delete(META_OAUTH_STATE_COOKIE);
    return response;
  }
}
