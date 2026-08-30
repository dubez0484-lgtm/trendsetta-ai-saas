import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { buttonClass } from "@/components/ui/Button";
import { PlatformBadge, StatusBadge } from "@/components/ui/Badge";
import { PIPELINE_STAGES, STATUS_LABEL, PLATFORM_LABEL } from "@/lib/constants/pipeline";
import { StatusSelect } from "@/components/StatusSelect";
import { cn } from "@/lib/utils";
import type { ContentItem, ContentStatus } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();
  const activeStatus = (searchParams.status as ContentStatus) || undefined;

  let query = supabase.from("content_items").select("*").order("updated_at", { ascending: false });
  if (activeStatus) query = query.eq("status", activeStatus);
  const { data } = await query;
  const items = (data ?? []) as ContentItem[];

  return (
    <>
      <TopBar title="Content Pipeline" />
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Link
              href="/pipeline"
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
                !activeStatus ? "bg-neon-500 text-matte-950" : "bg-white/5 text-white/60"
              )}
            >
              All
            </Link>
            {PIPELINE_STAGES.map((s) => (
              <Link
                key={s.key}
                href={`/pipeline?status=${s.key}`}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
                  activeStatus === s.key ? "bg-neon-500 text-matte-950" : "bg-white/5 text-white/60"
                )}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        <Link href="/content/new" className={cn(buttonClass("primary"), "mb-4 w-full")}>
          + New Content Idea
        </Link>

        <div className="space-y-2">
          {items.length === 0 && (
            <Card className="text-sm text-white/50">No content items in this stage yet.</Card>
          )}
          {items.map((item) => (
            <Card key={item.id}>
              <Link href={`/content/${item.id}`} className="block">
                <p className="truncate text-sm font-medium text-white">{item.title}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <PlatformBadge platform={item.platform} label={PLATFORM_LABEL[item.platform]} />
                  <StatusBadge status={item.status} label={STATUS_LABEL[item.status]} />
                </div>
              </Link>
              <div className="mt-3">
                <StatusSelect id={item.id} status={item.status} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
