"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

function payloadFrom(formData: FormData) {
  return {
    name: String(formData.get("name") || "Untitled"),
    platform: (formData.get("platform") as string) || null,
    positioning: (formData.get("positioning") as string) || null,
    content_pillars: (formData.get("content_pillars") as string) || null,
    content_format: (formData.get("content_format") as string) || null,
    engagement_observations: (formData.get("engagement_observations") as string) || null,
    interesting_hooks: (formData.get("interesting_hooks") as string) || null,
    market_gap: (formData.get("market_gap") as string) || null,
    notes: (formData.get("notes") as string) || null,
    source: (formData.get("source") as string) || null,
  };
}

export async function createCompetitor(formData: FormData) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("competitors")
    .insert({ owner_id: user.id, ...payloadFrom(formData) })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/competitors");
  redirect(`/competitors/${data.id}`);
}

export async function updateCompetitor(id: string, formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("competitors").update(payloadFrom(formData)).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/competitors");
  revalidatePath(`/competitors/${id}`);
}

export async function deleteCompetitor(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("competitors").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/competitors");
  redirect("/competitors");
}
