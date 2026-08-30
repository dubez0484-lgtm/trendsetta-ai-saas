import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { Label, Select, Textarea, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { createWeeklyReview, deleteWeeklyReview } from "@/app/actions/weekly-review";
import { REVIEW_VERDICTS } from "@/lib/constants/pipeline";
import { startOfWeek } from "@/lib/utils";
import type { WeeklyReview, ContentItem, ReviewVerdict } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const VERDICT_COLOR: Record<ReviewVerdict, string> = {
  keep: "text-emerald-400",
  kill: "text-red-400",
  double_down: "text-neon-400",
  test: "text-amber-400",
};

export default async function WeeklyReviewPage() {
  const supabase = createClient();
  const [{ data: reviews }, { data: content }] = await Promise.all([
    supabase
      .from("weekly_reviews")
      .select("*, content_items(title, platform)")
      .order("week_start", { ascending: false }),
    supabase.from("content_items").select("id, title").eq("status", "published").order("updated_at", { ascending: false }).limit(50),
  ]);

  const items = (reviews ?? []) as (WeeklyReview & { content_items: Pick<ContentItem, "title" | "platform"> | null })[];
  const contentItems = (content ?? []) as Pick<ContentItem, "id" | "title">[];

  const grouped = REVIEW_VERDICTS.map((v) => ({
    ...v,
    items: items.filter((i) => i.verdict === v.key),
  }));

  return (
    <>
      <TopBar title="Weekly Review" />
      <div className="space-y-6 p-4">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-white/70">Score a published piece</h2>
          <form action={createWeeklyReview} className="space-y-3">
            <div>
              <Label htmlFor="week_start">Week of</Label>
              <Input id="week_start" name="week_start" type="date" defaultValue={startOfWeek(new Date())} />
            </div>
            <div>
              <Label htmlFor="content_item_id">Content</Label>
              <Select id="content_item_id" name="content_item_id" required defaultValue="">
                <option value="" disabled>
                  Select published content
                </option>
                {contentItems.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="verdict">Verdict</Label>
              <Select id="verdict" name="verdict" defaultValue="test">
                {REVIEW_VERDICTS.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="reasoning">Why</Label>
              <Textarea id="reasoning" name="reasoning" rows={2} />
            </div>
            <Button type="submit" className="w-full">
              Log verdict
            </Button>
          </form>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {grouped.map((g) => (
            <div key={g.key}>
              <h2 className={`mb-2 text-sm font-semibold ${VERDICT_COLOR[g.key]}`}>{g.label}</h2>
              <div className="space-y-2">
                {g.items.length === 0 && <Card className="text-xs text-white/40">Nothing here yet.</Card>}
                {g.items.map((r) => (
                  <Card key={r.id}>
                    <p className="text-sm font-medium text-white">{r.content_items?.title ?? "Untitled"}</p>
                    <p className="mt-1 text-xs text-white/40">{r.week_start}</p>
                    {r.reasoning && <p className="mt-1 text-xs text-white/50">{r.reasoning}</p>}
                    <form action={deleteWeeklyReview.bind(null, r.id)} className="mt-2">
                      <Button type="submit" variant="ghost" className="!min-h-[32px] !py-1 text-[11px]">
                        Remove
                      </Button>
                    </form>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
