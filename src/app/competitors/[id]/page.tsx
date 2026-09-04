import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { Label, Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { updateCompetitor, deleteCompetitor } from "@/app/actions/competitors";
import type { Competitor } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function CompetitorDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase.from("competitors").select("*").eq("id", params.id).single();
  if (!data) notFound();
  const item = data as Competitor;

  const updateAction = updateCompetitor.bind(null, item.id);
  const deleteAction = deleteCompetitor.bind(null, item.id);

  return (
    <>
      <TopBar title="Competitor" />
      <div className="space-y-6 p-4">
        <Card>
          <form action={updateAction} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={item.name} required />
            </div>
            <div>
              <Label htmlFor="platform">Platform</Label>
              <Input id="platform" name="platform" defaultValue={item.platform ?? ""} />
            </div>
            <div>
              <Label htmlFor="positioning">Positioning</Label>
              <Textarea id="positioning" name="positioning" rows={2} defaultValue={item.positioning ?? ""} />
            </div>
            <div>
              <Label htmlFor="content_pillars">Content pillars</Label>
              <Textarea id="content_pillars" name="content_pillars" rows={2} defaultValue={item.content_pillars ?? ""} />
            </div>
            <div>
              <Label htmlFor="content_format">Content format</Label>
              <Input id="content_format" name="content_format" defaultValue={item.content_format ?? ""} />
            </div>
            <div>
              <Label htmlFor="engagement_observations">Engagement observations</Label>
              <Textarea id="engagement_observations" name="engagement_observations" rows={2} defaultValue={item.engagement_observations ?? ""} />
            </div>
            <div>
              <Label htmlFor="interesting_hooks">Interesting hooks</Label>
              <Textarea id="interesting_hooks" name="interesting_hooks" rows={2} defaultValue={item.interesting_hooks ?? ""} />
            </div>
            <div>
              <Label htmlFor="market_gap">Market gap / whitespace</Label>
              <Textarea id="market_gap" name="market_gap" rows={2} defaultValue={item.market_gap ?? ""} />
            </div>
            <div>
              <Label htmlFor="source">Source</Label>
              <Input id="source" name="source" defaultValue={item.source ?? ""} />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={2} defaultValue={item.notes ?? ""} />
            </div>
            <Button type="submit" className="w-full">
              Save changes
            </Button>
          </form>
        </Card>

        <form action={deleteAction}>
          <Button type="submit" variant="danger" className="w-full">
            Delete competitor
          </Button>
        </form>
      </div>
    </>
  );
}
