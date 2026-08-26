'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface AccountOption {
  id: string;
  platform: string;
  username: string | null;
}

export function NewAutomationForm({ accounts }: { accounts: AccountOption[] }) {
  const router = useRouter();
  const [socialAccountId, setSocialAccountId] = useState(accounts[0]?.id || '');
  const [keyword, setKeyword] = useState('');
  const [matchType, setMatchType] = useState<'CONTAINS' | 'EXACT' | 'REGEX'>('CONTAINS');
  const [replyMessage, setReplyMessage] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!socialAccountId) {
      setError('Connect an Instagram or Facebook account first.');
      return;
    }

    setLoading(true);
    const response = await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ socialAccountId, keyword, matchType, replyMessage, linkUrl, isActive: true }),
    });
    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error?.message || 'Failed to create automation.');
      return;
    }

    router.push('/dashboard/automations');
    router.refresh();
  }

  if (accounts.length === 0) {
    return (
      <div className="glass-panel p-6 text-sm text-slate-400">
        You need to connect an Instagram or Facebook account before creating an automation.{' '}
        <a href="/dashboard/accounts" className="text-neon-glow hover:underline">
          Connect an account →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel flex flex-col gap-4 p-6">
      {error && <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Account</label>
        <select value={socialAccountId} onChange={(e) => setSocialAccountId(e.target.value)} className="input-field">
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.platform} · {account.username || account.id}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
          When someone comments (keyword)
        </label>
        <input required value={keyword} onChange={(e) => setKeyword(e.target.value)} className="input-field" placeholder="LINK" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Match type</label>
        <select value={matchType} onChange={(e) => setMatchType(e.target.value as typeof matchType)} className="input-field">
          <option value="CONTAINS">Contains (case-insensitive)</option>
          <option value="EXACT">Exact match</option>
          <option value="REGEX">Regex</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Then send this DM</label>
        <textarea
          required
          value={replyMessage}
          onChange={(e) => setReplyMessage(e.target.value)}
          className="input-field"
          rows={3}
          placeholder="Thanks! Here's the link 👇"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Link URL (optional)</label>
        <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="input-field" placeholder="https://example.com" />
      </div>

      <button type="submit" disabled={loading} className="btn-primary self-start">
        {loading ? 'Creating…' : 'Create automation'}
      </button>
    </form>
  );
}
