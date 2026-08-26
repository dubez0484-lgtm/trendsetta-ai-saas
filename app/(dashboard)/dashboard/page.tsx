import { getCurrentUserId } from '@/lib/auth/session';
import { getUserDashboardStats } from '@/lib/automation/stats';
import { StatTile } from '@/components/dashboard/stat-tile';
import { StatusBadge } from '@/components/dashboard/status-badge';

export const dynamic = 'force-dynamic';

export default async function DashboardOverviewPage() {
  const userId = await getCurrentUserId();
  const stats = await getUserDashboardStats(userId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Overview</h1>
        <p className="text-sm text-slate-500">A snapshot of your comment-to-DM automation performance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="Total DMs sent" value={stats.totalDmsSent} accent />
        <StatTile label="Successful triggers" value={stats.successfulTriggers} />
        <StatTile label="Failed triggers" value={stats.failedTriggers} />
        <StatTile label="Active automations" value={stats.activeAutomations} />
        <StatTile label="Connected Instagram" value={stats.connectedInstagramAccounts} />
        <StatTile label="Connected Facebook" value={stats.connectedFacebookAccounts} />
      </div>

      <div className="glass-panel p-5">
        <h2 className="mb-3 font-display text-lg font-semibold text-white">Top-performing keywords</h2>
        {stats.topKeywords.length === 0 ? (
          <p className="text-sm text-slate-500">No successful DMs yet — top keywords will appear here once automations start firing.</p>
        ) : (
          <ul className="divide-y divide-matte-border">
            {stats.topKeywords.map((k) => (
              <li key={k.keyword} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-300">&ldquo;{k.keyword}&rdquo;</span>
                <span className="font-semibold text-neon-glow">{k.successfulDms} DMs</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="glass-panel p-5">
        <h2 className="mb-3 font-display text-lg font-semibold text-white">Recent trigger logs</h2>
        {stats.recentLogs.length === 0 ? (
          <p className="text-sm text-slate-500">No comments have triggered an automation yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Keyword</th>
                  <th className="pb-2 pr-4">Account</th>
                  <th className="pb-2">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-matte-border">
                {stats.recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2 pr-4">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="py-2 pr-4 text-slate-300">{log.automation.keyword}</td>
                    <td className="py-2 pr-4 text-slate-400">
                      {log.socialAccount.platform} · {log.socialAccount.username || 'unknown'}
                    </td>
                    <td className="py-2 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
