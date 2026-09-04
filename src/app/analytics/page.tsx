import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { formatNumber, engagementRate, linkedinEngagementRate } from "@/lib/utils";
import type { ContentAnalytics, ContentItem } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("content_analytics")
    .select("*, content_items(title, platform)")
    .order("captured_at", { ascending: false });

  const analytics = (rows ?? []) as (ContentAnalytics & {
    content_items: Pick<ContentItem, "title" | "platform"> | null;
  })[];

  const tiktok = analytics.filter((a) => a.platform === "tiktok");
  const linkedin = analytics.filter((a) => a.platform === "linkedin");

  const sum = (arr: (number | null)[]) => arr.reduce<number>((acc, v) => acc + (v ?? 0), 0);

  const tiktokTotals = {
    views: sum(tiktok.map((a) => a.views)),
    likes: sum(tiktok.map((a) => a.likes)),
    comments: sum(tiktok.map((a) => a.comments)),
    shares: sum(tiktok.map((a) => a.shares)),
    saves: sum(tiktok.map((a) => a.saves)),
    followers_gained: sum(tiktok.map((a) => a.followers_gained)),
    leads: sum(tiktok.map((a) => a.leads)),
  };

  const linkedinTotals = {
    impressions: sum(linkedin.map((a) => a.impressions)),
    reactions: sum(linkedin.map((a) => a.reactions)),
    comments: sum(linkedin.map((a) => a.comments)),
    reposts: sum(linkedin.map((a) => a.reposts)),
    followers_gained: sum(linkedin.map((a) => a.followers_gained)),
    leads: sum(linkedin.map((a) => a.leads)),
  };

  return (
    <>
      <TopBar title="Analytics" />
      <div className="space-y-6 p-4">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-white/60">TikTok totals</h2>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Views" value={formatNumber(tiktokTotals.views)} />
            <Stat label="Likes" value={formatNumber(tiktokTotals.likes)} />
            <Stat label="Comments" value={formatNumber(tiktokTotals.comments)} />
            <Stat label="Shares" value={formatNumber(tiktokTotals.shares)} />
            <Stat label="Followers gained" value={formatNumber(tiktokTotals.followers_gained)} />
            <Stat label="Leads" value={formatNumber(tiktokTotals.leads)} />
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-white/60">LinkedIn totals</h2>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Impressions" value={formatNumber(linkedinTotals.impressions)} />
            <Stat label="Reactions" value={formatNumber(linkedinTotals.reactions)} />
            <Stat label="Comments" value={formatNumber(linkedinTotals.comments)} />
            <Stat label="Reposts" value={formatNumber(linkedinTotals.reposts)} />
            <Stat label="Followers gained" value={formatNumber(linkedinTotals.followers_gained)} />
            <Stat label="Leads" value={formatNumber(linkedinTotals.leads)} />
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-white/60">Recent snapshots</h2>
          <div className="space-y-2">
            {analytics.length === 0 && (
              <Card className="text-sm text-white/50">
                No analytics logged yet. Open a content item and log a snapshot.
              </Card>
            )}
            {analytics.slice(0, 20).map((a) => {
              const rate = a.platform === "linkedin" ? linkedinEngagementRate(a) : engagementRate(a);
              return (
                <Link key={a.id} href={`/content/${a.content_item_id}`}>
                  <Card>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-white">
                        {a.content_items?.title ?? "Untitled"}
                      </p>
                      <span className="text-xs text-white/40">{a.captured_at}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/50">
                      reach {formatNumber(a.views ?? a.impressions)} · engagement{" "}
                      {rate === null ? "—" : `${rate.toFixed(1)}%`}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="text-center">
      <p className="text-xl font-bold text-neon-400">{value}</p>
      <p className="mt-1 text-[11px] text-white/50">{label}</p>
    </Card>
  );
}
