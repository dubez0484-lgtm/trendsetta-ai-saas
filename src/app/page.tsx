import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/TopBar";
import { Card, CardLink } from "@/components/ui/Card";
import { buttonClass } from "@/components/ui/Button";
import { PIPELINE_STAGES, STATUS_LABEL } from "@/lib/constants/pipeline";
import { StatusBadge, PlatformBadge } from "@/components/ui/Badge";
import { PLATFORM_LABEL } from "@/lib/constants/pipeline";
import type { ContentItem } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  const [{ data: items }, { data: leads }, { data: research }] = await Promise.all([
    supabase.from("content_items").select("*").order("updated_at", { ascending: false }),
    supabase.from("leads").select("id, stage"),
    supabase.from("research_items").select("id, claim_type"),
  ]);

  const contentItems = (items ?? []) as ContentItem[];
  const counts = Object.fromEntries(PIPELINE_STAGES.map((s) => [s.key, 0])) as Record<string, number>;
  for (const item of contentItems) counts[item.status] = (counts[item.status] ?? 0) + 1;

  const recent = contentItems.slice(0, 5);
  const openLeads = (leads ?? []).filter((l) => l.stage !== "opportunity").length;
  const opportunities = (leads ?? []).filter((l) => l.stage === "opportunity").length;
  const unresolvedResearch = (research ?? []).filter((r) => r.claim_type !== "fact").length;

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="space-y-6 p-4">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/content/new" className={buttonClass("primary", "w-full")}>
            + New Content
          </Link>
          <Link href="/research" className={buttonClass("ghost", "w-full")}>
            + New Research
          </Link>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-white/60">Pipeline snapshot</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {PIPELINE_STAGES.map((stage) => (
              <Link key={stage.key} href={`/pipeline?status=${stage.key}`}>
                <Card className="text-center">
                  <p className="text-2xl font-bold text-white">{counts[stage.key] ?? 0}</p>
                  <p className="mt-1 text-xs text-white/50">{stage.label}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card>
            <p className="text-xs uppercase tracking-wide text-white/40">Open leads</p>
            <p className="mt-1 text-2xl font-bold text-neon-400">{openLeads}</p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-wide text-white/40">Opportunities</p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">{opportunities}</p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-wide text-white/40">Unverified research</p>
            <p className="mt-1 text-2xl font-bold text-amber-400">{unresolvedResearch}</p>
          </Card>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-white/60">Recently updated</h2>
          <div className="space-y-2">
            {recent.length === 0 && (
              <Card className="text-sm text-white/50">
                No content yet. Start with your first idea.
              </Card>
            )}
            {recent.map((item) => (
              <CardLink key={item.id} href={`/content/${item.id}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-white">{item.title}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <PlatformBadge platform={item.platform} label={PLATFORM_LABEL[item.platform]} />
                  <StatusBadge status={item.status} label={STATUS_LABEL[item.status]} />
                </div>
              </CardLink>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
