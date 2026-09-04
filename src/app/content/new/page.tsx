import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/TopBar";
import { ContentForm } from "@/components/ContentForm";
import { Card } from "@/components/ui/Card";
import { Label, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { createContentItem, createPillar } from "@/app/actions/content";
import type { ContentPillar } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function NewContentPage() {
  const supabase = createClient();
  const { data: pillars } = await supabase.from("content_pillars").select("*").order("name");

  return (
    <>
      <TopBar title="New Content Idea" />
      <div className="space-y-4 p-4">
        <details className="group">
          <summary className="cursor-pointer text-xs text-white/50">
            No pillar fits? Add one
          </summary>
          <Card className="mt-2">
            <form action={createPillar} className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="pillar_name">Pillar name</Label>
                <Input id="pillar_name" name="name" placeholder="e.g. AI Automation" />
              </div>
              <Button type="submit" variant="ghost" className="!min-h-[44px]">
                Add
              </Button>
            </form>
          </Card>
        </details>

        <ContentForm
          action={createContentItem}
          pillars={(pillars ?? []) as ContentPillar[]}
          submitLabel="Create content item"
        />
      </div>
    </>
  );
}
