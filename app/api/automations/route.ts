import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUserId } from '@/lib/auth/session';
import { ApiError, toErrorResponse } from '@/lib/errors/api-error';
import { createAutomationSchema } from '@/lib/automation/validation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    const automations = await prisma.automation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        socialAccount: { select: { id: true, platform: true, username: true } },
        _count: { select: { triggerLogs: true } },
      },
    });

    return NextResponse.json({ success: true, data: automations });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const body = createAutomationSchema.parse(await request.json());

    const socialAccount = await prisma.socialAccount.findUnique({ where: { id: body.socialAccountId } });
    if (!socialAccount || socialAccount.userId !== userId) {
      throw new ApiError('NOT_FOUND', 'Connected account not found.');
    }

    const automation = await prisma.automation.create({
      data: {
        userId,
        socialAccountId: body.socialAccountId,
        keyword: body.keyword,
        matchType: body.matchType,
        replyMessage: body.replyMessage,
        linkUrl: body.linkUrl,
        isActive: body.isActive,
      },
    });

    return NextResponse.json({ success: true, data: automation }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
