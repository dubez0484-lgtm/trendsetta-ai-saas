import { beforeEach, describe, expect, it } from 'vitest';
import { Platform } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { executeAutomationForComment } from '@/lib/automation/engine';
import { createTestAutomation, createTestSocialAccount, createTestUser, resetDatabase } from '../helpers/db';

// MOCK_META=true in .env means sendInstagramPrivateReply/sendFacebookPrivateReply
// never hit the network — this exercises the real matching + persistence path.

beforeEach(async () => {
  await resetDatabase();
});

describe('executeAutomationForComment', () => {
  it('sends a DM and records a SUCCESS TriggerLog when the comment matches an active automation', async () => {
    const user = await createTestUser();
    const account = await createTestSocialAccount(user.id, { platform: Platform.INSTAGRAM, accountId: 'ig_1' });
    const automation = await createTestAutomation(user.id, account.id, { keyword: 'link' });

    const result = await executeAutomationForComment({
      platform: Platform.INSTAGRAM,
      accountId: 'ig_1',
      commentId: 'comment_1',
      commentText: 'please send the link',
      commenterId: 'commenter_1',
      commenterUsername: 'jane',
    });

    expect(result.status).toBe('SUCCESS');
    expect(result.automationId).toBe(automation.id);

    const log = await prisma.triggerLog.findUnique({ where: { id: result.triggerLogId! } });
    expect(log?.status).toBe('SUCCESS');
    expect(log?.dmSentAt).not.toBeNull();
  });

  it('returns SKIPPED when no active automation matches', async () => {
    const user = await createTestUser();
    const account = await createTestSocialAccount(user.id, { platform: Platform.INSTAGRAM, accountId: 'ig_2' });
    await createTestAutomation(user.id, account.id, { keyword: 'giveaway' });

    const result = await executeAutomationForComment({
      platform: Platform.INSTAGRAM,
      accountId: 'ig_2',
      commentId: 'comment_2',
      commentText: 'nice photo!',
      commenterId: 'commenter_2',
    });

    expect(result.status).toBe('SKIPPED');
    expect(await prisma.triggerLog.count()).toBe(0);
  });

  it('ignores disabled automations', async () => {
    const user = await createTestUser();
    const account = await createTestSocialAccount(user.id, { platform: Platform.INSTAGRAM, accountId: 'ig_3' });
    await createTestAutomation(user.id, account.id, { keyword: 'link', isActive: false });

    const result = await executeAutomationForComment({
      platform: Platform.INSTAGRAM,
      accountId: 'ig_3',
      commentId: 'comment_3',
      commentText: 'send the link',
      commenterId: 'commenter_3',
    });

    expect(result.status).toBe('SKIPPED');
  });

  it('returns SKIPPED for an account with no matching SocialAccount row', async () => {
    const result = await executeAutomationForComment({
      platform: Platform.FACEBOOK,
      accountId: 'unknown_account',
      commentId: 'comment_4',
      commentText: 'link please',
      commenterId: 'commenter_4',
    });

    expect(result.status).toBe('SKIPPED');
  });

  it('prevents duplicate execution for the same comment (idempotency)', async () => {
    const user = await createTestUser();
    const account = await createTestSocialAccount(user.id, { platform: Platform.INSTAGRAM, accountId: 'ig_5' });
    await createTestAutomation(user.id, account.id, { keyword: 'link' });

    const event = {
      platform: Platform.INSTAGRAM,
      accountId: 'ig_5',
      commentId: 'comment_5',
      commentText: 'the link please',
      commenterId: 'commenter_5',
    };

    const first = await executeAutomationForComment(event);
    const second = await executeAutomationForComment(event);

    expect(first.status).toBe('SUCCESS');
    expect(second.status).toBe('SKIPPED');
    expect(await prisma.triggerLog.count()).toBe(1);
  });

  it('only fires the first matching automation when several are active', async () => {
    const user = await createTestUser();
    const account = await createTestSocialAccount(user.id, { platform: Platform.INSTAGRAM, accountId: 'ig_6' });
    const first = await createTestAutomation(user.id, account.id, { keyword: 'link' });
    await createTestAutomation(user.id, account.id, { keyword: 'giveaway' });

    const result = await executeAutomationForComment({
      platform: Platform.INSTAGRAM,
      accountId: 'ig_6',
      commentId: 'comment_6',
      commentText: 'link giveaway',
      commenterId: 'commenter_6',
    });

    expect(result.automationId).toBe(first.id);
    expect(await prisma.triggerLog.count()).toBe(1);
  });
});
