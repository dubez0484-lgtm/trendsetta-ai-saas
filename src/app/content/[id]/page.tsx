import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/TopBar";
import { ContentForm } from "@/components/ContentForm";
import { Card } from "@/components/ui/Card";
import { CopyButton } from "@/components/ui/CopyButton";
import { Button } from "@/components/ui/Button";
import { Label, Select, Input } from "@/components/ui/Field";
import {
  updateContentItem,
  deleteContentItem,
  repurposeContentItem,
} from "@/app/actions/content";
import { logAnalytics } from "@/app/actions/analytics";
import { PLATFORMS, PLATFORM_LABEL } from "@/lib/constants/pipeline";
import type { ContentItem, ContentPillar, ContentAnalytics } from "@/lib/supabase/types";
import { formatNumber, engagementRate, linkedinEngagementRate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ContentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: item }, { data: pillars }, { data: derived }, { data: analytics }] = await Promise.all([
    supabase.from("content_items").select("*").eq("id", params.id).single(),
    supabase.from("content_pillars").select("*").order("name"),
    supabase.from("content_items").select("id, title, platform, status").eq("source_item_id", params.id),
    supabase
      .from("content_analytics")
      .select("*")
      .eq("content_item_id", params.id)
      .order("captured_at", { ascending: false }),
  ]);

  if (!item) notFound();

  const contentItem = item as ContentItem;
  const updateAction = updateContentItem.bind(null, contentItem.id);
  const deleteAction = deleteContentItem.bind(null, contentItem.id);
  const analyticsAction = logAnalytics.bind(null, contentItem.id, contentItem.platform);

  const copyBundle = [contentItem.hook, contentItem.script, contentItem.caption, contentItem.cta]
    .filter(Boolean)
    .join("\n\n");

  return (
    <>
      <TopBar title="Content Item" />
      <div className="space-y-6 p-4">
        {copyBundle && (
          <Card className="flex items-center justify-between gap-3">
            <p className="text-xs text-white/50">Copy hook + script + caption + CTA</p>
            <CopyButton text={copyBundle} />
          </Card>
        )}

        <ContentForm
          action={updateAction}
          item={contentItem}
          pillars={(pillars ?? []) as ContentPillar[]}
          submitLabel="Save changes"
        />

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-white/70">Repurpose (1-to-many engine)</h2>
          <p className="mb-3 text-xs text-white/40">
            Turn this build into an asset for another platform. It starts as a new idea linked back to this source.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {PLATFORMS.filter((p) => p.key !== contentItem.platform).map((p) => (
              <form key={p.key} action={repurposeContentItem.bind(null, contentItem.id, p.key)}>
                <input type="hidden" name="title" value={`${contentItem.title} — ${p.label}`} />
                <Button type="submit" variant="ghost" className="w-full">
                  → {p.label}
                </Button>
              </form>
            ))}
          </div>

          {derived && derived.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-white/40">Derived assets</p>
              {derived.map((d) => (
                <a key={d.id} href={`/content/${d.id}`} className="block text-sm text-neon-400 hover:underline">
                  {d.title} · {PLATFORM_LABEL[d.platform as keyof typeof PLATFORM_LABEL]}
                </a>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-white/70">Log analytics</h2>
          <form action={analyticsAction} className="space-y-3">
            <div>
              <Label htmlFor="captured_at">Captured on</Label>
              <Input id="captured_at" name="captured_at" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {contentItem.platform === "linkedin" ? (
                <>
                  <NumField name="impressions" label="Impressions" />
                  <NumField name="reactions" label="Reactions" />
                  <NumField name="comments" label="Comments" />
                  <NumField name="reposts" label="Reposts" />
                  <NumField name="saves" label="Saves" />
                  <NumField name="profile_visits" label="Profile visits" />
                  <NumField name="followers_gained" label="Followers gained" />
                  <NumField name="dms" label="DMs" />
                  <NumField name="leads" label="Leads" />
                </>
              ) : (
                <>
                  <NumField name="views" label="Views" />
                  <NumField name="watch_time_seconds" label="Watch time (s)" />
                  <NumField name="completion_rate" label="Completion %" />
                  <NumField name="likes" label="Likes" />
                  <NumField name="comments" label="Comments" />
                  <NumField name="shares" label="Shares" />
                  <NumField name="saves" label="Saves" />
                  <NumField name="profile_visits" label="Profile visits" />
                  <NumField name="followers_gained" label="Followers gained" />
                  <NumField name="leads" label="Leads" />
                </>
              )}
            </div>
            <Button type="submit" variant="ghost" className="w-full">
              Save analytics snapshot
            </Button>
          </form>

          {analytics && analytics.length > 0 && (
            <div className="mt-4 space-y-2">
              {(analytics as ContentAnalytics[]).map((a) => {
                const rate =
                  contentItem.platform === "linkedin" ? linkedinEngagementRate(a) : engagementRate(a);
                return (
                  <div key={a.id} className="rounded-lg border border-white/10 p-2 text-xs text-white/60">
                    <span className="text-white/40">{a.captured_at}</span>{" "}
                    · reach {formatNumber(a.views ?? a.impressions)} · engagement{" "}
                    {rate === null ? "—" : `${rate.toFixed(1)}%`}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <form action={deleteAction}>
          <Button type="submit" variant="danger" className="w-full">
            Delete content item
          </Button>
        </form>
      </div>
    </>
  );
}

function NumField({ name, label }: { name: string; label: string }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="number" inputMode="numeric" step="any" />
    </div>
  );
}
