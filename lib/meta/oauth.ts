/**
 * Meta OAuth flow: Facebook Login → page discovery → Instagram business
 * account discovery → persisted SocialAccount rows.
 *
 * Facebook Page IDs and Instagram Business Account IDs are NOT the same
 * value — a Page can have a linked IG business account, discovered via
 * `GET /{page-id}?fields=instagram_business_account`. Both are stored
 * separately on SocialAccount (pageId vs instagramUserId).
 */
import { encryptToken } from '@/lib/security/encryption';
import { logger } from '@/lib/security/logger';
import { prisma } from '@/lib/db/prisma';
import { getGraphApiBaseUrl, getGraphApiVersion } from '@/lib/meta/client';
import { Platform } from '@prisma/client';

// Scopes for Instagram comment-to-DM automation via "Instagram API with
// Facebook Login". See docs/META_SETUP.md for the App Review requirements
// behind each of these.
//
// These names were corrected against a live app's Permissions and
// Features console on 2026-08-26 (verified screenshot, not secondary
// research this time): for this exact product surface, Meta's console
// requests the older "instagram_basic" / "instagram_manage_comments" /
// "instagram_manage_messages" names, not "instagram_business_*" — an
// earlier version of this comment (based on secondary sources whose
// primary-doc fetch was network-blocked) had that backwards. The
// "instagram_business_*" renaming applies to the separate "Instagram API
// with Instagram Login" product, not this one.
//
// pages_manage_engagement / pages_manage_metadata / pages_messaging are
// deliberately NOT requested here: they do not appear as available
// permissions under this app's Instagram API use case at all (confirmed
// by scanning its full Permissions and Features list), which means this
// OAuth flow currently only supports Instagram comment-to-DM, not
// Facebook Page comment-to-DM. Requesting a scope the app doesn't have
// access to is worse than omitting it. Facebook Page support would need
// a separate use case/product added in the Meta console before these
// three could be requested again.
export const META_OAUTH_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'instagram_basic',
  'instagram_manage_comments',
  'instagram_manage_messages',
  'business_management',
].join(',');

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function buildMetaAuthorizationUrl(state: string): string {
  const appId = requireEnv('META_APP_ID');
  const redirectUri = requireEnv('META_REDIRECT_URI');

  const url = new URL(`https://www.facebook.com/${getGraphApiVersion()}/dialog/oauth`);
  url.searchParams.set('client_id', appId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('scope', META_OAUTH_SCOPES);
  url.searchParams.set('response_type', 'code');

  return url.toString();
}

interface TokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

/** Step 1: exchange the OAuth `code` for a short-lived user access token. */
export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const appId = requireEnv('META_APP_ID');
  const appSecret = requireEnv('META_APP_SECRET');
  const redirectUri = requireEnv('META_REDIRECT_URI');

  const url = new URL(`${getGraphApiBaseUrl()}/oauth/access_token`);
  url.searchParams.set('client_id', appId);
  url.searchParams.set('client_secret', appSecret);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('code', code);

  const response = await fetch(url.toString(), { method: 'GET', cache: 'no-store' });
  if (!response.ok) {
    const body = await response.text();
    logger.error('meta_oauth_code_exchange_failed', { status: response.status });
    throw new Error(`Failed to exchange OAuth code: ${body}`);
  }

  return (await response.json()) as TokenResponse;
}

/** Step 2: exchange a short-lived token for a long-lived (~60 day) token. */
export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<TokenResponse> {
  const appId = requireEnv('META_APP_ID');
  const appSecret = requireEnv('META_APP_SECRET');

  const url = new URL(`${getGraphApiBaseUrl()}/oauth/access_token`);
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('client_secret', appSecret);
  url.searchParams.set('fb_exchange_token', shortLivedToken);

  const response = await fetch(url.toString(), { method: 'GET', cache: 'no-store' });
  if (!response.ok) {
    const body = await response.text();
    logger.error('meta_oauth_long_lived_exchange_failed', { status: response.status });
    throw new Error(`Failed to exchange for long-lived token: ${body}`);
  }

  return (await response.json()) as TokenResponse;
}

export interface DiscoveredPage {
  id: string;
  name: string;
  access_token: string;
  instagramBusinessAccountId?: string;
  instagramUsername?: string;
}

/** Step 3 + 4: list Pages the user manages, and their linked IG business accounts. */
export async function discoverPagesAndInstagramAccounts(userAccessToken: string): Promise<DiscoveredPage[]> {
  const pagesUrl = new URL(`${getGraphApiBaseUrl()}/me/accounts`);
  pagesUrl.searchParams.set('access_token', userAccessToken);
  pagesUrl.searchParams.set('fields', 'id,name,access_token');

  const pagesResponse = await fetch(pagesUrl.toString(), { cache: 'no-store' });
  if (!pagesResponse.ok) {
    const body = await pagesResponse.text();
    logger.error('meta_page_discovery_failed', { status: pagesResponse.status });
    throw new Error(`Failed to discover Facebook Pages: ${body}`);
  }

  const pagesBody = (await pagesResponse.json()) as { data: DiscoveredPage[] };
  const pages = pagesBody.data ?? [];

  const withInstagram = await Promise.all(
    pages.map(async (page) => {
      const igUrl = new URL(`${getGraphApiBaseUrl()}/${page.id}`);
      igUrl.searchParams.set('fields', 'instagram_business_account{id,username}');
      igUrl.searchParams.set('access_token', page.access_token);

      const igResponse = await fetch(igUrl.toString(), { cache: 'no-store' });
      if (!igResponse.ok) {
        // A Page without a linked Instagram professional account is a
        // normal, expected outcome — not an error.
        return page;
      }

      const igBody = (await igResponse.json()) as {
        instagram_business_account?: { id: string; username: string };
      };

      return {
        ...page,
        instagramBusinessAccountId: igBody.instagram_business_account?.id,
        instagramUsername: igBody.instagram_business_account?.username,
      };
    }),
  );

  return withInstagram;
}

/**
 * Step 5: persist discovered Pages/Instagram accounts as SocialAccount
 * rows for the given user. Tokens are encrypted before storage.
 */
export async function persistDiscoveredAccounts(userId: string, pages: DiscoveredPage[]): Promise<void> {
  for (const page of pages) {
    const encryptedPageToken = encryptToken(page.access_token);

    await prisma.socialAccount.upsert({
      where: { platform_accountId: { platform: Platform.FACEBOOK, accountId: page.id } },
      create: {
        userId,
        platform: Platform.FACEBOOK,
        accountId: page.id,
        accessToken: encryptedPageToken,
        username: page.name,
        pageId: page.id,
      },
      update: {
        accessToken: encryptedPageToken,
        username: page.name,
        pageId: page.id,
      },
    });

    if (page.instagramBusinessAccountId) {
      await prisma.socialAccount.upsert({
        where: {
          platform_accountId: { platform: Platform.INSTAGRAM, accountId: page.instagramBusinessAccountId },
        },
        create: {
          userId,
          platform: Platform.INSTAGRAM,
          accountId: page.instagramBusinessAccountId,
          accessToken: encryptedPageToken, // IG messaging uses the Page access token.
          username: page.instagramUsername,
          pageId: page.id,
          instagramUserId: page.instagramBusinessAccountId,
        },
        update: {
          accessToken: encryptedPageToken,
          username: page.instagramUsername,
          pageId: page.id,
          instagramUserId: page.instagramBusinessAccountId,
        },
      });
    }
  }

  logger.info('meta_accounts_connected', { userId, pageCount: pages.length });
}
