/**
 * Test database helpers. Tests run against a real local Postgres database
 * (DATABASE_URL from .env) rather than mocking Prisma — the schema's
 * unique constraints and cascades are core to correctness here (webhook
 * idempotency, duplicate-comment prevention), and a mock would just
 * re-implement Prisma badly.
 */
import { Platform, MatchType } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { encryptToken } from '@/lib/security/encryption';

export async function resetDatabase() {
  await prisma.triggerLog.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.automation.deleteMany();
  await prisma.mcpApiKey.deleteMany();
  await prisma.socialAccount.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
}

let userCounter = 0;

export async function createTestUser(overrides: Partial<{ email: string; name: string }> = {}) {
  userCounter += 1;
  return prisma.user.create({
    data: {
      email: overrides.email || `test-user-${userCounter}@example.com`,
      name: overrides.name || 'Test User',
    },
  });
}

let accountCounter = 0;

export async function createTestSocialAccount(
  userId: string,
  overrides: Partial<{ platform: Platform; accountId: string; accessToken: string; username: string }> = {},
) {
  accountCounter += 1;
  const platform = overrides.platform || Platform.INSTAGRAM;
  const accountId = overrides.accountId || `test-account-${accountCounter}`;

  return prisma.socialAccount.create({
    data: {
      userId,
      platform,
      accountId,
      accessToken: encryptToken(overrides.accessToken || 'fake-access-token'),
      username: overrides.username || `test_account_${accountCounter}`,
      pageId: platform === Platform.FACEBOOK ? accountId : undefined,
      instagramUserId: platform === Platform.INSTAGRAM ? accountId : undefined,
    },
  });
}

export async function createTestAutomation(
  userId: string,
  socialAccountId: string,
  overrides: Partial<{ keyword: string; matchType: MatchType; replyMessage: string; linkUrl: string; isActive: boolean }> = {},
) {
  return prisma.automation.create({
    data: {
      userId,
      socialAccountId,
      keyword: overrides.keyword ?? 'link',
      matchType: overrides.matchType ?? MatchType.CONTAINS,
      replyMessage: overrides.replyMessage ?? "Thanks! Here's the link.",
      linkUrl: overrides.linkUrl,
      isActive: overrides.isActive ?? true,
    },
  });
}
