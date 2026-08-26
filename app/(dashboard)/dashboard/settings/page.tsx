import { prisma } from '@/lib/db/prisma';
import { getCurrentUserId } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const userId = await getCurrentUserId();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, email: true, subscriptionTier: true, createdAt: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-500">Account details and MCP access.</p>
      </div>

      <section className="glass-panel p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-white">Account</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Name</dt>
            <dd className="text-slate-200">{user.name || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="text-slate-200">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Subscription tier</dt>
            <dd className="text-neon-glow">{user.subscriptionTier}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Member since</dt>
            <dd className="text-slate-200">{new Date(user.createdAt).toLocaleDateString()}</dd>
          </div>
        </dl>
      </section>

      <section className="glass-panel p-5">
        <h2 className="mb-2 font-display text-lg font-semibold text-white">MCP access</h2>
        <p className="text-sm text-slate-400">
          AI agents (e.g. Claude) can create, list, and analyze automations through the MCP server started with{' '}
          <code className="rounded bg-matte-black/60 px-1.5 py-0.5 text-xs text-neon-glow">npm run mcp</code>. Access is
          controlled by the <code className="rounded bg-matte-black/60 px-1.5 py-0.5 text-xs">MCP_AUTH_TOKEN</code> and{' '}
          <code className="rounded bg-matte-black/60 px-1.5 py-0.5 text-xs">MCP_AUTH_USER_EMAIL</code> environment
          variables — the token is never shown in this dashboard. See{' '}
          <span className="text-neon-glow">README.md</span> for setup.
        </p>
      </section>
    </div>
  );
}
