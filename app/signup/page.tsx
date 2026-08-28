'use client';

import { useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error?.message || 'Could not create account.');
      setLoading(false);
      return;
    }

    const result = await signIn('credentials', { redirect: false, email, password });
    setLoading(false);

    if (result?.error) {
      setError('Account created — please sign in.');
      router.push('/login');
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="glass-panel neon-border w-full max-w-sm px-8 py-10">
        <h1 className="mb-6 font-display text-2xl font-bold text-white">Create your account</h1>

        {error && <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Name</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className="input-field mb-4" placeholder="Jane Doe" />

        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field mb-4"
          placeholder="you@example.com"
        />

        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Password</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field mb-6"
          placeholder="At least 8 characters"
        />

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="text-neon-glow hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
