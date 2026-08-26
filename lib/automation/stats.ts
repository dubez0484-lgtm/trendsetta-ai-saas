/**
 * Analytics/statistics queries, shared by the dashboard overview page,
 * /api/analytics, and the MCP `get_automation_stats` tool so numbers
 * never disagree between surfaces.
 */
import { Platform, TriggerStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export interface DashboardStats {
  totalDmsSent: number;
  successfulTriggers: number;
  failedTriggers: number;
  activeAutomations: number;
  connectedInstagramAccounts: number;
  connectedFacebookAccounts: number;
  topKeywords: { keyword: string; successfulDms: number }[];
  recentLogs: Awaited<ReturnType<typeof fetchRecentLogs>>;
}

async function fetchRecentLogs(userId: string, take = 20) {
  return prisma.triggerLog.findMany({
    where: { automation: { userId } },
    orderBy: { createdAt: 'desc' },
    take,
    include: {
      automation: { select: { id: true, keyword: true } },
      socialAccount: { select: { platform: true, username: true } },
    },
  });
}

export async function getUserDashboardStats(userId: string): Promise<DashboardStats> {
  const [triggerCounts, activeAutomations, socialAccounts, automationsWithLogs, recentLogs] = await Promise.all([
    prisma.triggerLog.groupBy({
      by: ['status'],
      where: { automation: { userId } },
      _count: { _all: true },
    }),
    prisma.automation.count({ where: { userId, isActive: true } }),
    prisma.socialAccount.findMany({ where: { userId }, select: { platform: true } }),
    prisma.automation.findMany({
      where: { userId },
      select: {
        keyword: true,
        triggerLogs: { where: { status: TriggerStatus.SUCCESS }, select: { id: true } },
      },
    }),
    fetchRecentLogs(userId),
  ]);

  const countFor = (status: TriggerStatus) =>
    triggerCounts.find((row) => row.status === status)?._count._all ?? 0;

  const topKeywords = automationsWithLogs
    .map((a) => ({ keyword: a.keyword, successfulDms: a.triggerLogs.length }))
    .filter((k) => k.successfulDms > 0)
    .sort((a, b) => b.successfulDms - a.successfulDms)
    .slice(0, 10);

  return {
    totalDmsSent: countFor(TriggerStatus.SUCCESS),
    successfulTriggers: countFor(TriggerStatus.SUCCESS),
    failedTriggers: countFor(TriggerStatus.FAILED),
    activeAutomations,
    connectedInstagramAccounts: socialAccounts.filter((a) => a.platform === Platform.INSTAGRAM).length,
    connectedFacebookAccounts: socialAccounts.filter((a) => a.platform === Platform.FACEBOOK).length,
    topKeywords,
    recentLogs,
  };
}

export interface AutomationStats {
  automationId: string;
  totalTriggers: number;
  successfulDms: number;
  failedDms: number;
  skipped: number;
  successRate: number | null;
  topKeywords: { keyword: string; successfulDms: number }[];
  recentLogs: Awaited<ReturnType<typeof fetchAutomationLogs>>;
  conversionTracking: 'unavailable';
  conversionTrackingNote: string;
}

async function fetchAutomationLogs(automationId: string, take = 20) {
  return prisma.triggerLog.findMany({
    where: { automationId },
    orderBy: { createdAt: 'desc' },
    take,
  });
}

/**
 * Per-automation statistics. Conversion tracking (did the DM recipient
 * actually convert — click the link, complete a purchase, etc.) is
 * explicitly NOT invented here: this schema only records that a DM was
 * attempted/sent, not what happened after. Returning a fabricated
 * conversion rate would be worse than admitting the gap.
 */
export async function getAutomationStats(automationId: string): Promise<AutomationStats> {
  const [automation, triggerCounts, recentLogs] = await Promise.all([
    prisma.automation.findUniqueOrThrow({ where: { id: automationId }, select: { keyword: true } }),
    prisma.triggerLog.groupBy({
      by: ['status'],
      where: { automationId },
      _count: { _all: true },
    }),
    fetchAutomationLogs(automationId),
  ]);

  const countFor = (status: TriggerStatus) =>
    triggerCounts.find((row) => row.status === status)?._count._all ?? 0;

  const successfulDms = countFor(TriggerStatus.SUCCESS);
  const failedDms = countFor(TriggerStatus.FAILED);
  const skipped = countFor(TriggerStatus.SKIPPED);
  const totalTriggers = successfulDms + failedDms + skipped;
  const attempted = successfulDms + failedDms;

  return {
    automationId,
    totalTriggers,
    successfulDms,
    failedDms,
    skipped,
    successRate: attempted > 0 ? Number((successfulDms / attempted).toFixed(4)) : null,
    topKeywords: successfulDms > 0 ? [{ keyword: automation.keyword, successfulDms }] : [],
    recentLogs,
    conversionTracking: 'unavailable',
    conversionTrackingNote:
      'This schema records DM delivery attempts only, not recipient behavior after the DM is sent. ' +
      'Measuring actual conversions (link clicks, purchases, replies) would require additional event ' +
      'tracking: UTM-tagged/short links per automation with click logging, and/or a conversion webhook ' +
      'from the destination page back into this system.',
  };
}
