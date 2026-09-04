"use client";

import { useTransition } from "react";
import { setContentStatus } from "@/app/actions/content";
import { PIPELINE_STAGES } from "@/lib/constants/pipeline";
import type { ContentStatus } from "@/lib/supabase/types";
import { Select } from "@/components/ui/Field";

export function StatusSelect({ id, status }: { id: string; status: ContentStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={status}
      disabled={isPending}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const next = e.target.value as ContentStatus;
        startTransition(() => {
          setContentStatus(id, next);
        });
      }}
      className="!min-h-[36px] !py-1.5 text-xs"
    >
      {PIPELINE_STAGES.map((s) => (
        <option key={s.key} value={s.key}>
          {s.label}
        </option>
      ))}
    </Select>
  );
}
