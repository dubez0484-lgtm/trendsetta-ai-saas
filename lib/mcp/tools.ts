/**
 * MCP tool implementations, as plain userId-scoped functions so they're
 * directly unit-testable and identical whether invoked over the MCP
 * transport or (in principle) a future internal caller. Every function
 * takes an already-authorized `userId` — never a client-supplied one.
 */
import { prisma } from '@/lib/db/prisma';
import { TriggerStatus } from '@prisma/client';
import { mcpCreateAutomationSchema } from '@/lib/automation/validation';
import { getAutomationStats } from '@/lib/automation/stats';
import { z } from 'zod';

export class McpToolError extends Error {}

export async function createAutomationTool(userId: string, rawInput: unknown) {
  const input = mcpCreateAutomationSchema.parse(rawInput);

  const socialAccount = await prisma.socialAccount.findFirst({
    where: { userId, platform: input.platform },
    orderBy: { createdAt: 'desc' },
  });

  if (!socialAccount) {
    throw new McpToolError(
      `No connected ${input.platform} account found for this user. Connect one via /dashboard/accounts first.`,
    );
  }

  const automation = await prisma.automation.create({
    data: {
      userId,
      socialAccountId: socialAccount.id,
      keyword: input.keyword,
      matchType: input.matchType,
      replyMessage: input.replyMessage,
      linkUrl: input.linkUrl,
      isActive: true,
    },
  });

  return {
    id: automation.id,
    keyword: automation.keyword,
    matchType: automation.matchType,
    platform: input.platform,
    socialAccountId: socialAccount.id,
    socialAccountUsername: socialAccount.username,
    replyMessage: automation.replyMessage,
    linkUrl: automation.linkUrl,
    isActive: automation.isActive,
    createdAt: automation.createdAt.toISOString(),
  };
}

export async function listAutomationsTool(userId: string) {
  const automations = await prisma.automation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      socialAccount: { select: { platform: true, username: true } },
      triggerLogs: { select: { status: true } },
    },
  });

  return automations.map((automation) => ({
    id: automation.id,
    keyword: automation.keyword,
    matchType: automation.matchType,
    platform: automation.socialAccount.platform,
    accountUsername: automation.socialAccount.username,
    isActive: automation.isActive,
    replyMessage: automation.replyMessage,
    linkUrl: automation.linkUrl,
    triggerCount: automation.triggerLogs.length,
    successfulDmCount: automation.triggerLogs.filter((l) => l.status === TriggerStatus.SUCCESS).length,
    failedCount: automation.triggerLogs.filter((l) => l.status === TriggerStatus.FAILED).length,
    createdAt: automation.createdAt.toISOString(),
  }));
}

export const getAutomationStatsInputSchema = z.object({ automationId: z.string().min(1) });

export async function getAutomationStatsTool(userId: string, rawInput: unknown) {
  const { automationId } = getAutomationStatsInputSchema.parse(rawInput);

  const automation = await prisma.automation.findUnique({ where: { id: automationId } });
  if (!automation || automation.userId !== userId) {
    throw new McpToolError('Automation not found.');
  }

  return getAutomationStats(automationId);
}
