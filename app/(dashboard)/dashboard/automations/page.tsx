import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUserId } from '@/lib/auth/session';
import { AutomationCard } from '@/components/automations/automation-card';

export const dynamic = 'force-dynamic';

export default async function AutomationsPage() {
  const userId = await getCurrentUserId();
  const automations = await prisma.automation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      socialAccount: { select: { platform: true, username: true } },
      _count: { select: { triggerLogs: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Automations</h1>
          <p className="text-sm text-slate-500">Comments that match a keyword automatically get a private DM reply.</p>
        </div>
        <Link href="/dashboard/automations/new" className="btn-primary text-sm">
          New automation
        </Link>
      </div>

      {automations.length === 0 ? (
        <div className="glass-panel p-8 text-center">
          <p className="text-sm text-slate-400">No automations yet.</p>
          <Link href="/dashboard/automations/new" className="btn-primary mt-4 inline-flex text-sm">
            Create your first automation
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {automations.map((automation) => (
            <AutomationCard key={automation.id} automation={automation} />
          ))}
        </div>
      )}
    </div>
  );
}
