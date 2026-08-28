import { beforeEach, describe, expect, it } from 'vitest';
import { Platform } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { resolveMcpAuthContext, McpAuthError } from '@/lib/mcp/auth';
import { createAutomationTool, getAutomationStatsTool, listAutomationsTool, McpToolError } from '@/lib/mcp/tools';
import { createTestAutomation, createTestSocialAccount, createTestUser, resetDatabase } from '../helpers/db';

beforeEach(async () => {
  await resetDatabase();
});

describe('resolveMcpAuthContext', () => {
  it('resolves the bound user for a valid MCP_AUTH_TOKEN', async () => {
    const user = await createTestUser({ email: process.env.MCP_AUTH_USER_EMAIL });
    const ctx = await resolveMcpAuthContext(`Bearer ${process.env.MCP_AUTH_TOKEN}`);
    expect(ctx.userId).toBe(user.id);
  });

  it('rejects a missing Authorization header', async () => {
    await expect(resolveMcpAuthContext(undefined)).rejects.toThrow(McpAuthError);
  });

  it('rejects an invalid token', async () => {
    await expect(resolveMcpAuthContext('Bearer wrong-token')).rejects.toThrow(McpAuthError);
  });

  it('rejects a malformed header (no Bearer prefix)', async () => {
    await expect(resolveMcpAuthContext(process.env.MCP_AUTH_TOKEN)).rejects.toThrow(McpAuthError);
  });
});

describe('create_automation MCP tool', () => {
  it('creates an automation attached to the caller\'s most recent account for the platform', async () => {
    const user = await createTestUser();
    await createTestSocialAccount(user.id, { platform: Platform.INSTAGRAM, accountId: 'ig_a' });
    const newest = await createTestSocialAccount(user.id, { platform: Platform.INSTAGRAM, accountId: 'ig_b' });

    const result = await createAutomationTool(user.id, {
      keyword: 'giveaway',
      replyMessage: 'Thanks for entering!',
      platform: 'INSTAGRAM',
      matchType: 'CONTAINS',
    });

    expect(result.socialAccountId).toBe(newest.id);

    const stored = await prisma.automation.findUnique({ where: { id: result.id } });
    expect(stored?.userId).toBe(user.id);
  });

  it('never lets the caller specify another user\'s id', async () => {
    const user = await createTestUser();
    await createTestSocialAccount(user.id, { platform: Platform.INSTAGRAM });

    const result = await createAutomationTool(user.id, {
      keyword: 'x',
      replyMessage: 'y',
      platform: 'INSTAGRAM',
      matchType: 'CONTAINS',
      // Not part of the input type (rawInput is `unknown`) — probes that a stray userId
      // field on the wire is ignored, not honored, since Zod strips unknown keys.
      userId: 'someone-elses-id',
    });

    const stored = await prisma.automation.findUniqueOrThrow({ where: { id: result.id } });
    expect(stored.userId).toBe(user.id);
  });

  it('throws when the user has no connected account for the platform', async () => {
    const user = await createTestUser();
    await expect(
      createAutomationTool(user.id, { keyword: 'x', replyMessage: 'y', platform: 'FACEBOOK', matchType: 'CONTAINS' }),
    ).rejects.toThrow(McpToolError);
  });
});

describe('list_automations MCP tool', () => {
  it('returns only the caller\'s automations with trigger counts', async () => {
    const user = await createTestUser();
    const otherUser = await createTestUser();

    const account = await createTestSocialAccount(user.id, { platform: Platform.INSTAGRAM });
    await createTestAutomation(user.id, account.id, { keyword: 'link' });

    const otherAccount = await createTestSocialAccount(otherUser.id, { platform: Platform.INSTAGRAM });
    await createTestAutomation(otherUser.id, otherAccount.id, { keyword: 'other' });

    const result = await listAutomationsTool(user.id);
    expect(result).toHaveLength(1);
    expect(result[0]?.keyword).toBe('link');
  });
});

describe('get_automation_stats MCP tool', () => {
  it('reports conversion tracking as unavailable rather than inventing data', async () => {
    const user = await createTestUser();
    const account = await createTestSocialAccount(user.id, { platform: Platform.INSTAGRAM });
    const automation = await createTestAutomation(user.id, account.id);

    const stats = await getAutomationStatsTool(user.id, { automationId: automation.id });
    expect(stats.conversionTracking).toBe('unavailable');
    expect(stats.conversionTrackingNote.length).toBeGreaterThan(0);
  });

  it('refuses to return stats for another user\'s automation', async () => {
    const owner = await createTestUser();
    const attacker = await createTestUser();
    const account = await createTestSocialAccount(owner.id, { platform: Platform.INSTAGRAM });
    const automation = await createTestAutomation(owner.id, account.id);

    await expect(getAutomationStatsTool(attacker.id, { automationId: automation.id })).rejects.toThrow(McpToolError);
  });
});
