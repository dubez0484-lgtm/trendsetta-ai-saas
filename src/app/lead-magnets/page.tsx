import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { Label, Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { createLeadMagnet, deleteLeadMagnet } from "@/app/actions/leads";
import type { LeadMagnet } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function LeadMagnetsPage() {
  const supabase = createClient();
  const { data } = await supabase.from("lead_magnets").select("*").order("created_at", { ascending: false });
  const items = (data ?? []) as LeadMagnet[];

  return (
    <>
      <TopBar title="Lead Magnets" />
      <div className="space-y-6 p-4">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-white/70">New lead magnet</h2>
          <form action={createLeadMagnet} className="space-y-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={2} />
            </div>
            <div>
              <Label htmlFor="delivery_url">Delivery URL</Label>
              <Input id="delivery_url" name="delivery_url" type="url" placeholder="https://…" />
            </div>
            <Button type="submit" className="w-full">
              Create lead magnet
            </Button>
          </form>
        </Card>

        <div className="space-y-2">
          {items.length === 0 && <Card className="text-sm text-white/50">No lead magnets yet.</Card>}
          {items.map((m) => (
            <Card key={m.id}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">{m.name}</p>
                {m.delivery_url && <CopyButton text={m.delivery_url} />}
              </div>
              {m.description && <p className="mt-1 text-xs text-white/50">{m.description}</p>}
              <form action={deleteLeadMagnet.bind(null, m.id)} className="mt-2">
                <Button type="submit" variant="danger" className="!min-h-[36px] !py-1.5 text-xs">
                  Delete
                </Button>
              </form>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
