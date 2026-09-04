import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatPercent(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return `${n.toFixed(1)}%`;
}

/** engagement rate = (likes + comments + shares + saves) / views, TikTok-style */
export function engagementRate(row: {
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  saves?: number | null;
}): number | null {
  if (!row.views) return null;
  const interactions =
    (row.likes ?? 0) + (row.comments ?? 0) + (row.shares ?? 0) + (row.saves ?? 0);
  return (interactions / row.views) * 100;
}

/** LinkedIn engagement rate = (reactions + comments + reposts) / impressions */
export function linkedinEngagementRate(row: {
  impressions?: number | null;
  reactions?: number | null;
  comments?: number | null;
  reposts?: number | null;
}): number | null {
  if (!row.impressions) return null;
  const interactions = (row.reactions ?? 0) + (row.comments ?? 0) + (row.reposts ?? 0);
  return (interactions / row.impressions) * 100;
}

export function leadConversionRate(row: {
  views?: number | null;
  impressions?: number | null;
  leads?: number | null;
}): number | null {
  const reach = row.views ?? row.impressions;
  if (!reach || !row.leads) return null;
  return (row.leads / reach) * 100;
}

export function startOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday as start of week
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}
