'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface AutomationCardData {
  id: string;
  keyword: string;
  matchType: 'CONTAINS' | 'EXACT' | 'REGEX';
  replyMessage: string;
  linkUrl: string | null;
  isActive: boolean;
  socialAccount: { platform: string; username: string | null };
  _count: { triggerLogs: number };
}

export function AutomationCard({ automation }: { automation: AutomationCardData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [busy, setBusy] = useState(false);

  const [keyword, setKeyword] = useState(automation.keyword);
  const [matchType, setMatchType] = useState(automation.matchType);
  const [replyMessage, setReplyMessage] = useState(automation.replyMessage);
  const [linkUrl, setLinkUrl] = useState(automation.linkUrl || '');

  const [testComment, setTestComment] = useState('');
  const [testResult, setTestResult] = useState<{ status: string; reason: string } | null>(null);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    const response = await fetch(`/api/automations/${automation.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (response.ok) router.refresh();
    else alert('Update failed.');
  }

  async function handleToggleActive() {
    await patch({ isActive: !automation.isActive });
  }

  async function handleSaveEdit() {
    await patch({ keyword, matchType, replyMessage, linkUrl });
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete the "${automation.keyword}" automation? This cannot be undone.`)) return;
    setBusy(true);
    const response = await fetch(`/api/automations/${automation.id}`, { method: 'DELETE' });
    setBusy(false);
    if (response.ok) router.refresh();
    else alert('Delete failed.');
  }

  async function handleTest() {
    if (!testComment.trim()) return;
    setBusy(true);
    setTestResult(null);
    const response = await fetch(`/api/automations/${automation.id}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentText: testComment }),
    });
    const body = await response.json();
    setBusy(false);
    setTestResult(response.ok ? body.data : { status: 'FAILED', reason: body.error?.message || 'Test failed.' });
  }

  return (
    <div className="glass-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-neon-blue/30 bg-neon-blue/10 px-2 py-0.5 text-xs font-medium text-neon-glow">
              {automation.socialAccount.platform}
            </span>
            <span className="rounded-full border border-matte-border px-2 py-0.5 text-xs text-slate-400">{automation.matchType}</span>
          </div>
          <p className="mt-2 font-display text-lg font-semibold text-white">&ldquo;{automation.keyword}&rdquo;</p>
          <p className="text-xs text-slate-500">
            {automation.socialAccount.username || 'Unknown account'} · {automation._count.triggerLogs} triggers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleActive}
            disabled={busy}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              automation.isActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-600/20 text-slate-400'
            }`}
          >
            {automation.isActive ? 'Active' : 'Disabled'}
          </button>
          <button onClick={() => setEditing((v) => !v)} className="btn-secondary text-xs">
            Edit
          </button>
          <button onClick={() => setTesting((v) => !v)} className="btn-secondary text-xs">
            Test
          </button>
          <button onClick={handleDelete} disabled={busy} className="btn-secondary text-xs text-red-300 hover:border-red-500/50">
            Delete
          </button>
        </div>
      </div>

      {!editing && (
        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-400">
          {automation.replyMessage}
          {automation.linkUrl && <span className="block text-neon-glow">{automation.linkUrl}</span>}
        </p>
      )}

      {editing && (
        <div className="mt-4 flex flex-col gap-3 border-t border-matte-border pt-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Keyword</label>
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Match type</label>
            <select
              value={matchType}
              onChange={(e) => setMatchType(e.target.value as AutomationCardData['matchType'])}
              className="input-field"
            >
              <option value="CONTAINS">Contains</option>
              <option value="EXACT">Exact</option>
              <option value="REGEX">Regex</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Reply message</label>
            <textarea value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} className="input-field" rows={3} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Link URL (optional)</label>
            <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="input-field" placeholder="https://example.com" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveEdit} disabled={busy} className="btn-primary text-xs">
              Save
            </button>
            <button onClick={() => setEditing(false)} className="btn-secondary text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}

      {testing && (
        <div className="mt-4 flex flex-col gap-3 border-t border-matte-border pt-4">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Simulate a comment</label>
          <textarea
            value={testComment}
            onChange={(e) => setTestComment(e.target.value)}
            className="input-field"
            rows={2}
            placeholder="e.g. I want the link!"
          />
          <button onClick={handleTest} disabled={busy} className="btn-primary self-start text-xs">
            Run test
          </button>
          {testResult && (
            <p className="rounded-lg border border-matte-border bg-matte-black/40 px-3 py-2 text-xs text-slate-300">
              <strong className="text-neon-glow">{testResult.status}</strong> — {testResult.reason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
