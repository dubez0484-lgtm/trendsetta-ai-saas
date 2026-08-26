import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUserId } from '@/lib/auth/session';
import { ApiError, toErrorResponse } from '@/lib/errors/api-error';

export const dynamic = 'force-dynamic';

/** Disconnects a Social Account. Cascades to its automations and logs. */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getCurrentUserId();
    const account = await prisma.socialAccount.findUnique({ where: { id: params.id } });

    if (!account || account.userId !== userId) {
      throw new ApiError('NOT_FOUND', 'Connected account not found.');
    }

    await prisma.socialAccount.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true, data: { id: params.id } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
