import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { Label, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { CLAIM_TYPES } from "@/lib/constants/pipeline";
import { updateResearchItem, deleteResearchItem } from "@/app/actions/research";
import type { ResearchItem } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function ResearchDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase.from("research_items").select("*").eq("id", params.id).single();
  if (!data) notFound();
  const item = data as ResearchItem;

  const updateAction = updateResearchItem.bind(null, item.id);
  const deleteAction = deleteResearchItem.bind(null, item.id);

  return (
    <>
      <TopBar title="Research Item" />
      <div className="space-y-6 p-4">
        <Card>
          <form action={updateAction} className="space-y-4">
            <div>
              <Label htmlFor="topic">Topic</Label>
              <Input id="topic" name="topic" defaultValue={item.topic} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="claim_type">Type</Label>
                <Select id="claim_type" name="claim_type" defaultValue={item.claim_type}>
                  {CLAIM_TYPES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="confidence">Confidence (1-5)</Label>
                <Input id="confidence" name="confidence" type="number" min={1} max={5} defaultValue={item.confidence ?? ""} />
              </div>
            </div>
            <div>
              <Label htmlFor="claim">Claim</Label>
              <Textarea id="claim" name="claim" rows={2} defaultValue={item.claim ?? ""} />
            </div>
            <div>
              <Label htmlFor="evidence">Evidence</Label>
              <Textarea id="evidence" name="evidence" rows={3} defaultValue={item.evidence ?? ""} />
            </div>
            <div>
              <Label htmlFor="source">Source</Label>
              <Input id="source" name="source" defaultValue={item.source ?? ""} />
            </div>
            <div>
              <Label htmlFor="source_url">Source URL</Label>
              <Input id="source_url" name="source_url" type="url" defaultValue={item.source_url ?? ""} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="competitor">Related competitor</Label>
                <Input id="competitor" name="competitor" defaultValue={item.competitor ?? ""} />
              </div>
              <div>
                <Label htmlFor="trend">Trend</Label>
                <Input id="trend" name="trend" defaultValue={item.trend ?? ""} />
              </div>
            </div>
            <div>
              <Label htmlFor="opportunity">Opportunity</Label>
              <Textarea id="opportunity" name="opportunity" rows={2} defaultValue={item.opportunity ?? ""} />
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
            Delete research item
          </Button>
        </form>
      </div>
    </>
  );
}
