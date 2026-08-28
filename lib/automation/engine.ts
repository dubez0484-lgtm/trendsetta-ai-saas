/**
 * Automation execution engine — the single reusable path from "a comment
 * happened" to "a DM was sent and logged". Used by the Meta webhook
 * handler, the dashboard's manual "test automation" action, and the MCP
 * server, so behavior never drifts between entry points.
 *
 * Webhook → normalize event → find account → find active automations →
 * match keyword → prevent duplicate execution → send DM → record
 * TriggerLog → return result.
 */
import { Platform, Prisma, type Automation, type TriggerStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { decryptToken } from '@/lib/security/encryption';
import { logger } from '@/lib/security/logger';
import { matchAutomation } from '@/lib/automation/matcher';
import { sendFacebookPrivateReply, sendInstagramPrivateReply } from '@/lib/meta/messaging';

const MAX_STORED_COMMENT_LENGTH = 2200;

/** A comment event normalized to a platform-agnostic shape. */
export interface NormalizedCommentEvent {
  platform: Platform;
  /** The connected account's platform-native ID: Page ID for Facebook, IG Business Account ID for Instagram. */
  accountId: string;
  commentId: string;
  commentText: string;
  commenterId: string;
  commenterUsername?: string;
  postId?: string;
  postUrl?: string;
}

export interface EngineResult {
  status: TriggerStatus;
  automationId?: string;
  triggerLogId?: string;
  reason: string;
  messageId?: string;
}

/**
 * Runs the full comment → DM automation flow for a single normalized
 * comment event. Idempotent: re-running with the same (accountId,
 * commentId) after a successful or failed attempt returns SKIPPED instead
 * of sending a second DM.
 */
export async function executeAutomationForComment(event: NormalizedCommentEvent): Promise<EngineResult> {
  const socialAccount = await prisma.socialAccount.findUnique({
    where: { platform_accountId: { platform: event.platform, accountId: event.accountId } },
  });

  if (!socialAccount) {
    logger.info('automation_engine_no_account', { platform: event.platform, accountId: event.accountId });
    return { status: 'SKIPPED', reason: 'No connected social account matches this event.' };
  }

  const existingLog = await prisma.triggerLog.findUnique({
    where: { socialAccountId_commentId: { socialAccountId: socialAccount.id, commentId: event.commentId } },
  });

  if (existingLog) {
    logger.info('automation_engine_duplicate_comment', { commentId: event.commentId });
    return { status: 'SKIPPED', reason: 'This comment has already been processed.', triggerLogId: existingLog.id };
  }

  const automations = await prisma.automation.findMany({
    where: { socialAccountId: socialAccount.id, isActive: true },
    orderBy: { createdAt: 'asc' },
  });

  let matched: Automation | undefined;
  let matchReason = 'No active automation matched this comment.';

  for (const automation of automations) {
    const result = matchAutomation(event.commentText, automation);
    if (result.matched) {
      matched = automation;
      matchReason = result.reason;
      break;
    }
  }

  if (!matched) {
    logger.info('automation_engine_no_match', { socialAccountId: socialAccount.id, commentId: event.commentId });
    return { status: 'SKIPPED', reason: matchReason };
  }

  logger.info('automation_engine_matched', {
    automationId: matched.id,
    socialAccountId: socialAccount.id,
    commentId: event.commentId,
  });

  const accessToken = decryptToken(socialAccount.accessToken);
  const message = matched.linkUrl ? `${matched.replyMessage}\n${matched.linkUrl}` : matched.replyMessage;

  const sendResult =
    event.platform === Platform.INSTAGRAM
      ? await sendInstagramPrivateReply(event.commentId, accessToken, message)
      : await sendFacebookPrivateReply(event.commentId, accessToken, message);

  const status: TriggerStatus = sendResult.success ? 'SUCCESS' : 'FAILED';

  try {
    const triggerLog = await prisma.triggerLog.create({
      data: {
        automationId: matched.id,
        socialAccountId: socialAccount.id,
        commenterId: event.commenterId,
        commenterUsername: event.commenterUsername,
        commentId: event.commentId,
        postId: event.postId,
        postUrl: event.postUrl,
        commentText: event.commentText.slice(0, MAX_STORED_COMMENT_LENGTH),
        status,
        errorMessage: sendResult.success ? null : sendResult.error,
        dmSentAt: sendResult.success ? new Date() : null,
      },
    });

    logger.info(sendResult.success ? 'automation_engine_dm_succeeded' : 'automation_engine_dm_failed', {
      automationId: matched.id,
      triggerLogId: triggerLog.id,
      status,
    });

    return {
      status,
      automationId: matched.id,
      triggerLogId: triggerLog.id,
      reason: sendResult.success ? 'DM sent successfully.' : sendResult.error || 'DM send failed.',
      messageId: sendResult.messageId,
    };
  } catch (error) {
    // A unique constraint violation here means a concurrent delivery won
    // the race — the webhook-level WebhookEvent idempotency table is the
    // primary defense, this is a second layer.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      logger.info('automation_engine_race_duplicate', { commentId: event.commentId });
      return { status: 'SKIPPED', reason: 'This comment was already processed by a concurrent request.' };
    }
    throw error;
  }
}
