export function StatTile({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="glass-panel px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${accent ? 'text-neon-glow' : 'text-white'}`}>{value}</p>
    </div>
  );
}
