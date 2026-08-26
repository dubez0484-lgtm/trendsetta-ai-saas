import { prisma } from '@/lib/db/prisma';
import { getCurrentUserId } from '@/lib/auth/session';
import { NewAutomationForm } from '@/components/automations/new-automation-form';

export const dynamic = 'force-dynamic';

export default async function NewAutomationPage() {
  const userId = await getCurrentUserId();
  const accounts = await prisma.socialAccount.findMany({
    where: { userId },
    select: { id: true, platform: true, username: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">New automation</h1>
        <p className="text-sm text-slate-500">Define a keyword trigger and the DM it sends.</p>
      </div>

      <NewAutomationForm accounts={accounts} />
    </div>
  );
}
