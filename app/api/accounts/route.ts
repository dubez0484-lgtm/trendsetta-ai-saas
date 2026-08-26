import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUserId } from '@/lib/auth/session';
import { toErrorResponse } from '@/lib/errors/api-error';

// Access tokens are never selected here — the dashboard must only ever
// see connection status, never the underlying secret.
const SAFE_SELECT = {
  id: true,
  platform: true,
  username: true,
  pageId: true,
  instagramUserId: true,
  tokenExpiresAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const accounts = await prisma.socialAccount.findMany({
      where: { userId },
      select: SAFE_SELECT,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: accounts });
  } catch (error) {
    return toErrorResponse(error);
  }
}
