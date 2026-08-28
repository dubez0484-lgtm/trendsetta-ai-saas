import { prisma } from '@/lib/db/prisma';
import { getCurrentUserId } from '@/lib/auth/session';
import { DisconnectButton } from '@/components/accounts/disconnect-button';

export const dynamic = 'force-dynamic';

const ERROR_MESSAGES: Record<string, string> = {
  meta_authorization_denied: 'You declined the Meta authorization request.',
  invalid_oauth_state: 'The connection request expired or was invalid — please try again.',
  connection_failed_at_token_exchange: 'Failed to exchange the authorization code with Meta. Check META_APP_ID/META_APP_SECRET/META_REDIRECT_URI.',
  connection_failed_at_long_lived_token_exchange: 'Failed to exchange for a long-lived token with Meta.',
  connection_failed_at_account_discovery: "Failed to discover your Facebook Pages/Instagram accounts — check that your account has a role on the Meta app and the required permissions are granted.",
  connection_failed_at_persist_accounts: 'Connected to Meta successfully, but saving the account failed — likely a database issue. Check server logs.',
};

export default async function AccountsPage({ searchParams }: { searchParams: { connected?: string; error?: string } }) {
  const userId = await getCurrentUserId();
  const accounts = await prisma.socialAccount.findMany({
    where: { userId },
    select: {
      id: true,
      platform: true,
      username: true,
      pageId: true,
      instagramUserId: true,
      tokenExpiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const instagramAccounts = accounts.filter((a) => a.platform === 'INSTAGRAM');
  const facebookAccounts = accounts.filter((a) => a.platform === 'FACEBOOK');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Connected accounts</h1>
        <p className="text-sm text-slate-500">
          Connect your Facebook Page — Meta discovers its linked Instagram professional account automatically.
        </p>
      </div>

      {searchParams.connected && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Account connected successfully.
        </p>
      )}
      {searchParams.error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {ERROR_MESSAGES[searchParams.error] || 'Something went wrong.'}
        </p>
      )}

      <section className="glass-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">Instagram</h2>
          <a href="/api/auth/meta" className="btn-primary text-xs">
            Connect Instagram
          </a>
        </div>
        <AccountList accounts={instagramAccounts} emptyLabel="Not connected" />
      </section>

      <section className="glass-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">Facebook</h2>
          <a href="/api/auth/meta" className="btn-primary text-xs">
            Connect Facebook
          </a>
        </div>
        <AccountList accounts={facebookAccounts} emptyLabel="Not connected" />
      </section>
    </div>
  );
}

interface AccountRow {
  id: string;
  platform: string;
  username: string | null;
  tokenExpiresAt: Date | null;
  createdAt: Date;
}

function AccountList({ accounts, emptyLabel }: { accounts: AccountRow[]; emptyLabel: string }) {
  if (accounts.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <ul className="divide-y divide-matte-border">
      {accounts.map((account) => (
        <li key={account.id} className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-slate-200">{account.username || 'Connected account'}</p>
            <p className="text-xs text-slate-500">Connected {new Date(account.createdAt).toLocaleDateString()}</p>
          </div>
          <DisconnectButton accountId={account.id} />
        </li>
      ))}
    </ul>
  );
}
