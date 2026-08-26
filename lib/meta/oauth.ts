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

// Scopes required for comment-to-DM automation across Facebook Pages and
// connected Instagram professional accounts. See docs/META_SETUP.md for
// the App Review requirements behind each of these.
//
// NOTE: the Instagram scopes below use the "instagram_business_*" naming.
// Meta retired the older "instagram_basic" / "instagram_manage_comments" /
// "instagram_manage_messages" names on January 27, 2025 — using them today
// will fail. Facebook Page scopes (pages_*) were not renamed.
export const META_OAUTH_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_engagement',
  'pages_manage_metadata',
  'pages_messaging',
  'instagram_business_basic',
  'instagram_business_manage_comments',
  'instagram_business_manage_messages',
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
