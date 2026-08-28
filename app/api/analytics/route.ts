import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth/session';
import { toErrorResponse } from '@/lib/errors/api-error';
import { getUserDashboardStats } from '@/lib/automation/stats';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const stats = await getUserDashboardStats(userId);
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return toErrorResponse(error);
  }
}
