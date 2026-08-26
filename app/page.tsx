import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="glass-panel neon-border max-w-xl px-8 py-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-neon-glow">THETRENDSETTA™</p>
        <h1 className="mb-4 font-display text-3xl font-bold text-white sm:text-4xl">
          Meta Comment-to-DM Automation Engine
        </h1>
        <p className="mb-8 text-sm text-slate-400 sm:text-base">
          Watch Instagram &amp; Facebook comments, detect keywords, and automatically send a private DM —
          hands-off, in real time.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/signup" className="btn-primary">
            Get started
          </Link>
          <Link href="/login" className="btn-secondary">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
