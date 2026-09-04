import { cn } from "@/lib/utils";
import type { ContentStatus, ContentPlatform, ClaimType } from "@/lib/supabase/types";

const STATUS_STYLE: Record<ContentStatus, string> = {
  idea: "bg-white/10 text-white/70",
  research: "bg-indigo-500/15 text-indigo-300",
  script: "bg-violet-500/15 text-violet-300",
  record: "bg-amber-500/15 text-amber-300",
  edit: "bg-orange-500/15 text-orange-300",
  ready: "bg-neon-500/15 text-neon-400",
  published: "bg-emerald-500/15 text-emerald-300",
  analytics: "bg-sky-500/15 text-sky-300",
  repurpose: "bg-pink-500/15 text-pink-300",
  learn: "bg-fuchsia-500/15 text-fuchsia-300",
};

export function StatusBadge({ status, label }: { status: ContentStatus; label: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide", STATUS_STYLE[status])}>
      {label}
    </span>
  );
}

const PLATFORM_STYLE: Record<ContentPlatform, string> = {
  tiktok: "bg-white/10 text-white",
  linkedin: "bg-sky-500/15 text-sky-300",
  threads_x: "bg-white/10 text-white/80",
};

export function PlatformBadge({ platform, label }: { platform: ContentPlatform; label: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold", PLATFORM_STYLE[platform])}>
      {label}
    </span>
  );
}

const CLAIM_STYLE: Record<ClaimType, string> = {
  fact: "bg-emerald-500/15 text-emerald-300",
  hypothesis: "bg-amber-500/15 text-amber-300",
  opinion: "bg-white/10 text-white/70",
};

export function ClaimBadge({ claim, label }: { claim: ClaimType; label: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide", CLAIM_STYLE[claim])}>
      {label}
    </span>
  );
}
