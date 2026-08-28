const STYLES: Record<string, string> = {
  SUCCESS: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  FAILED: 'bg-red-500/15 text-red-300 border-red-500/30',
  SKIPPED: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STYLES[status] || STYLES.SKIPPED}`}>{status}</span>;
}
