'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DisconnectButton({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDisconnect() {
    if (!confirm('Disconnect this account? Its automations will stop running.')) return;

    setLoading(true);
    const response = await fetch(`/api/accounts/${accountId}`, { method: 'DELETE' });
    setLoading(false);

    if (response.ok) {
      router.refresh();
    } else {
      alert('Failed to disconnect account.');
    }
  }

  return (
    <button onClick={handleDisconnect} disabled={loading} className="btn-secondary text-xs">
      {loading ? 'Disconnecting…' : 'Disconnect'}
    </button>
  );
}
