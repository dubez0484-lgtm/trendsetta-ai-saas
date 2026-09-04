"use client";

import { useTransition } from "react";
import { updateLeadStage } from "@/app/actions/leads";
import { LEAD_STAGES } from "@/lib/constants/pipeline";
import type { LeadStage } from "@/lib/supabase/types";
import { Select } from "@/components/ui/Field";

export function LeadStageSelect({ id, stage }: { id: string; stage: LeadStage }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={stage}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as LeadStage;
        startTransition(() => {
          updateLeadStage(id, next);
        });
      }}
      className="!min-h-[36px] !py-1.5 text-xs"
    >
      {LEAD_STAGES.map((s) => (
        <option key={s.key} value={s.key}>
          {s.label}
        </option>
      ))}
    </Select>
  );
}
