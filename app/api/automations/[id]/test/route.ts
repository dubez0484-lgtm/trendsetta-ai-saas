/**
 * Manual "test automation" action for the dashboard: runs the same
 * automation engine the webhook uses, against a sample comment text the
 * user supplies, so they can verify matching + message content without
 * waiting for a real comment. Uses a synthetic commentId so it never
 * collides with (and is never mistaken for) a real TriggerLog.
 */
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUserId } from '@/lib/auth/session';
import { ApiError, toErrorResponse } from '@/lib/errors/api-error';
import { executeAutomationForComment } from '@/lib/automation/engine';

export const dynamic = 'force-dynamic';

const testSchema = z.object({
  commentText: z.string().min(1).max(2200),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getCurrentUserId();
    const { commentText } = testSchema.parse(await request.json());

    const automation = await prisma.automation.findUnique({
      where: { id: params.id },
      include: { socialAccount: true },
    });

    if (!automation || automation.userId !== userId) {
      throw new ApiError('NOT_FOUND', 'Automation not found.');
    }

    const result = await executeAutomationForComment({
      platform: automation.socialAccount.platform,
      accountId: automation.socialAccount.accountId,
      commentId: `test_${randomUUID()}`,
      commentText,
      commenterId: `test_user_${userId}`,
      commenterUsername: 'test_user',
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
