import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { Label, Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { createCompetitor } from "@/app/actions/competitors";
import type { Competitor } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function CompetitorsPage() {
  const supabase = createClient();
  const { data } = await supabase.from("competitors").select("*").order("name");
  const items = (data ?? []) as Competitor[];

  return (
    <>
      <TopBar title="Competitor Intel" />
      <div className="space-y-6 p-4">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-white/70">Add a creator / brand to track</h2>
          <form action={createCompetitor} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Input id="platform" name="platform" placeholder="TikTok, LinkedIn…" />
              </div>
            </div>
            <div>
              <Label htmlFor="positioning">Positioning</Label>
              <Textarea id="positioning" name="positioning" rows={2} />
            </div>
            <div>
              <Label htmlFor="market_gap">Market gap / whitespace</Label>
              <Textarea id="market_gap" name="market_gap" rows={2} />
            </div>
            <Button type="submit" className="w-full">
              Add competitor
            </Button>
          </form>
        </Card>

        <div className="space-y-2">
          {items.length === 0 && <Card className="text-sm text-white/50">No competitors tracked yet.</Card>}
          {items.map((c) => (
            <Link key={c.id} href={`/competitors/${c.id}`}>
              <Card>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">{c.name}</p>
                  {c.platform && <span className="text-xs text-white/40">{c.platform}</span>}
                </div>
                {c.positioning && <p className="mt-1 line-clamp-2 text-xs text-white/50">{c.positioning}</p>}
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
