import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { Label, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ClaimBadge } from "@/components/ui/Badge";
import { CLAIM_TYPES } from "@/lib/constants/pipeline";
import { createResearchItem } from "@/app/actions/research";
import type { ResearchItem } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const CLAIM_LABEL = Object.fromEntries(CLAIM_TYPES.map((c) => [c.key, c.label]));

export default async function ResearchPage() {
  const supabase = createClient();
  const { data } = await supabase.from("research_items").select("*").order("created_at", { ascending: false });
  const items = (data ?? []) as ResearchItem[];

  return (
    <>
      <TopBar title="Research" />
      <div className="space-y-6 p-4">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-white/70">Quick add</h2>
          <form action={createResearchItem} className="space-y-3">
            <div>
              <Label htmlFor="topic">Topic</Label>
              <Input id="topic" name="topic" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="claim_type">Type</Label>
                <Select id="claim_type" name="claim_type" defaultValue="hypothesis">
                  {CLAIM_TYPES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="confidence">Confidence (1-5)</Label>
                <Input id="confidence" name="confidence" type="number" min={1} max={5} />
              </div>
            </div>
            <div>
              <Label htmlFor="claim">Claim</Label>
              <Textarea id="claim" name="claim" rows={2} />
            </div>
            <div>
              <Label htmlFor="source_url">Source URL</Label>
              <Input id="source_url" name="source_url" type="url" placeholder="https://…" />
            </div>
            <Button type="submit" className="w-full">
              Add research item
            </Button>
          </form>
        </Card>

        <div className="space-y-2">
          {items.length === 0 && <Card className="text-sm text-white/50">No research logged yet.</Card>}
          {items.map((r) => (
            <Link key={r.id} href={`/research/${r.id}`}>
              <Card>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-white">{r.topic}</p>
                  <ClaimBadge claim={r.claim_type} label={CLAIM_LABEL[r.claim_type]} />
                </div>
                {r.claim && <p className="mt-1 line-clamp-2 text-xs text-white/50">{r.claim}</p>}
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
