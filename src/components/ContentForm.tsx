"use client";

import { useState } from "react";
import { Label, Input, Textarea, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PLATFORMS, PIPELINE_STAGES } from "@/lib/constants/pipeline";
import { templatesForPlatform } from "@/lib/constants/templates";
import type { ContentItem, ContentPillar, ContentPlatform } from "@/lib/supabase/types";

export function ContentForm({
  action,
  item,
  pillars,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  item?: ContentItem;
  pillars: ContentPillar[];
  submitLabel: string;
}) {
  const [platform, setPlatform] = useState<ContentPlatform>(item?.platform ?? "tiktok");
  const templates = templatesForPlatform(platform);

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="title">Title / working name</Label>
        <Input id="title" name="title" required defaultValue={item?.title} placeholder="e.g. How I automated client onboarding" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="platform">Platform</Label>
          <Select
            id="platform"
            name="platform"
            defaultValue={platform}
            onChange={(e) => setPlatform(e.target.value as ContentPlatform)}
          >
            {PLATFORMS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={item?.status ?? "idea"}>
            {PIPELINE_STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="pillar_id">Content pillar</Label>
          <Select id="pillar_id" name="pillar_id" defaultValue={item?.pillar_id ?? ""}>
            <option value="">None</option>
            {pillars.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        {!item && (
          <div>
            <Label htmlFor="template_key">Template</Label>
            <Select id="template_key" name="template_key" defaultValue="">
              <option value="">None</option>
              {templates.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="hook">Hook / 3-second opening</Label>
        <Textarea id="hook" name="hook" rows={2} defaultValue={item?.hook ?? ""} />
      </div>

      <div>
        <Label htmlFor="script">{platform === "linkedin" ? "Body" : "Script"}</Label>
        <Textarea id="script" name="script" rows={5} defaultValue={item?.script ?? ""} />
      </div>

      <div>
        <Label htmlFor="visual_direction">Visual direction</Label>
        <Textarea id="visual_direction" name="visual_direction" rows={2} defaultValue={item?.visual_direction ?? ""} />
      </div>

      <div>
        <Label htmlFor="cta">CTA</Label>
        <Input id="cta" name="cta" defaultValue={item?.cta ?? ""} />
      </div>

      <div>
        <Label htmlFor="caption">Caption</Label>
        <Textarea id="caption" name="caption" rows={3} defaultValue={item?.caption ?? ""} />
      </div>

      <div>
        <Label htmlFor="keywords">Keywords (comma-separated)</Label>
        <Input id="keywords" name="keywords" defaultValue={item?.keywords?.join(", ") ?? ""} />
      </div>

      <div>
        <Label htmlFor="publish_date">Publish date</Label>
        <Input id="publish_date" name="publish_date" type="date" defaultValue={item?.publish_date ?? ""} />
      </div>

      {item && (
        <div>
          <Label htmlFor="published_url">Published URL</Label>
          <Input id="published_url" name="published_url" defaultValue={item?.published_url ?? ""} />
        </div>
      )}

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} defaultValue={item?.notes ?? ""} />
      </div>

      <Button type="submit" className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
