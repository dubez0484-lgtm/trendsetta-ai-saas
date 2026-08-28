/**
 * Step 1 of the Meta OAuth flow: redirect the signed-in user to Facebook's
 * OAuth dialog, with a random `state` value bound to an httpOnly cookie
 * for CSRF protection on the callback.
 */
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth/session';
import { buildMetaAuthorizationUrl } from '@/lib/meta/oauth';

export const META_OAUTH_STATE_COOKIE = 'meta_oauth_state';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await getCurrentUserId();
  } catch {
    return NextResponse.redirect(new URL('/login?next=/dashboard/accounts', request.url));
  }

  const state = randomUUID();
  const authorizationUrl = buildMetaAuthorizationUrl(state);

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(META_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 900,
  });

  return response;
}
