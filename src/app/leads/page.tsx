import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { Label, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { LeadStageSelect } from "@/components/LeadStageSelect";
import { createLead } from "@/app/actions/leads";
import { LEAD_STAGES } from "@/lib/constants/pipeline";
import type { Lead, LeadMagnet, ContentItem } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const STAGE_LABEL = Object.fromEntries(LEAD_STAGES.map((s) => [s.key, s.label]));

export default async function LeadsPage() {
  const supabase = createClient();
  const [{ data: leads }, { data: leadMagnets }, { data: content }] = await Promise.all([
    supabase.from("leads").select("*").order("created_at", { ascending: false }),
    supabase.from("lead_magnets").select("*").order("name"),
    supabase.from("content_items").select("id, title").order("updated_at", { ascending: false }).limit(50),
  ]);

  const items = (leads ?? []) as Lead[];
  const magnets = (leadMagnets ?? []) as LeadMagnet[];
  const contentItems = (content ?? []) as Pick<ContentItem, "id" | "title">[];

  return (
    <>
      <TopBar title="Leads" />
      <div className="space-y-6 p-4">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-white/70">Add a lead</h2>
          <form action={createLead} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" />
              </div>
              <div>
                <Label htmlFor="contact">Contact</Label>
                <Input id="contact" name="contact" placeholder="email, phone, @handle" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="source_item_id">Source content</Label>
                <Select id="source_item_id" name="source_item_id" defaultValue="">
                  <option value="">None</option>
                  {contentItems.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="lead_magnet_id">Lead magnet</Label>
                <Select id="lead_magnet_id" name="lead_magnet_id" defaultValue="">
                  <option value="">None</option>
                  {magnets.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="stage">Stage</Label>
              <Select id="stage" name="stage" defaultValue="comment_cta">
                {LEAD_STAGES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
            <Button type="submit" className="w-full">
              Add lead
            </Button>
          </form>
        </Card>

        <div className="space-y-2">
          {items.length === 0 && <Card className="text-sm text-white/50">No leads yet.</Card>}
          {items.map((lead) => (
            <Card key={lead.id}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">{lead.name || "Unnamed lead"}</p>
                <span className="text-xs text-white/40">{STAGE_LABEL[lead.stage]}</span>
              </div>
              {lead.contact && <p className="mt-1 text-xs text-white/50">{lead.contact}</p>}
              <div className="mt-2">
                <LeadStageSelect id={lead.id} stage={lead.stage} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
