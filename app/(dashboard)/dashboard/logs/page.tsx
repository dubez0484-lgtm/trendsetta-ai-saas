import { prisma } from '@/lib/db/prisma';
import { getCurrentUserId } from '@/lib/auth/session';
import { StatusBadge } from '@/components/dashboard/status-badge';

export const dynamic = 'force-dynamic';

export default async function LogsPage() {
  const userId = await getCurrentUserId();
  const logs = await prisma.triggerLog.findMany({
    where: { automation: { userId } },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      automation: { select: { keyword: true } },
      socialAccount: { select: { platform: true, username: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Trigger logs</h1>
        <p className="text-sm text-slate-500">Every comment that matched an automation, and what happened next.</p>
      </div>

      <div className="glass-panel overflow-x-auto p-5">
        {logs.length === 0 ? (
          <p className="text-sm text-slate-500">No trigger logs yet.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Keyword</th>
                <th className="pb-2 pr-4">Account</th>
                <th className="pb-2 pr-4">Commenter</th>
                <th className="pb-2 pr-4">Comment</th>
                <th className="pb-2 pr-4">Error</th>
                <th className="pb-2">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-matte-border">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="py-2 pr-4">
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="py-2 pr-4 text-slate-300">{log.automation.keyword}</td>
                  <td className="py-2 pr-4 text-slate-400">
                    {log.socialAccount.platform} · {log.socialAccount.username || 'unknown'}
                  </td>
                  <td className="py-2 pr-4 text-slate-400">{log.commenterUsername || log.commenterId}</td>
                  <td className="max-w-xs truncate py-2 pr-4 text-slate-400" title={log.commentText}>
                    {log.commentText}
                  </td>
                  <td className="max-w-xs truncate py-2 pr-4 text-red-400" title={log.errorMessage || ''}>
                    {log.errorMessage || '—'}
                  </td>
                  <td className="py-2 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
