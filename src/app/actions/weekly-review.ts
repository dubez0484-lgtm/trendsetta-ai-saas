"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ReviewVerdict } from "@/lib/supabase/types";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export async function createWeeklyReview(formData: FormData) {
  const { supabase, user } = await requireUser();
  const payload = {
    owner_id: user.id,
    week_start: String(formData.get("week_start")),
    content_item_id: String(formData.get("content_item_id")),
    verdict: (String(formData.get("verdict"))) as ReviewVerdict,
    reasoning: (formData.get("reasoning") as string) || null,
  };
  const { error } = await supabase.from("weekly_reviews").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/weekly-review");
}

export async function deleteWeeklyReview(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("weekly_reviews").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/weekly-review");
}
