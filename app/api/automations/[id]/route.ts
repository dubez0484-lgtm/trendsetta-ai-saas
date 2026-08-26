import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUserId } from '@/lib/auth/session';
import { ApiError, toErrorResponse } from '@/lib/errors/api-error';
import { updateAutomationSchema } from '@/lib/automation/validation';

export const dynamic = 'force-dynamic';

async function loadOwnedAutomation(id: string, userId: string) {
  const automation = await prisma.automation.findUnique({ where: { id } });
  if (!automation || automation.userId !== userId) {
    throw new ApiError('NOT_FOUND', 'Automation not found.');
  }
  return automation;
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getCurrentUserId();
    const automation = await prisma.automation.findUnique({
      where: { id: params.id },
      include: {
        socialAccount: { select: { id: true, platform: true, username: true } },
        triggerLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!automation || automation.userId !== userId) {
      throw new ApiError('NOT_FOUND', 'Automation not found.');
    }

    return NextResponse.json({ success: true, data: automation });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getCurrentUserId();
    await loadOwnedAutomation(params.id, userId);

    const body = updateAutomationSchema.parse(await request.json());

    const automation = await prisma.automation.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json({ success: true, data: automation });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getCurrentUserId();
    await loadOwnedAutomation(params.id, userId);

    await prisma.automation.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true, data: { id: params.id } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
