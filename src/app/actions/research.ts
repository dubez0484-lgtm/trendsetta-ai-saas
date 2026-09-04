"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ClaimType } from "@/lib/supabase/types";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

function payloadFrom(formData: FormData) {
  const confidenceRaw = formData.get("confidence") as string;
  return {
    topic: String(formData.get("topic") || "Untitled research"),
    source: (formData.get("source") as string) || null,
    source_url: (formData.get("source_url") as string) || null,
    claim: (formData.get("claim") as string) || null,
    claim_type: (String(formData.get("claim_type") || "hypothesis")) as ClaimType,
    evidence: (formData.get("evidence") as string) || null,
    competitor: (formData.get("competitor") as string) || null,
    trend: (formData.get("trend") as string) || null,
    opportunity: (formData.get("opportunity") as string) || null,
    confidence: confidenceRaw ? Number(confidenceRaw) : null,
    notes: (formData.get("notes") as string) || null,
  };
}

export async function createResearchItem(formData: FormData) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("research_items")
    .insert({ owner_id: user.id, ...payloadFrom(formData) })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/research");
  redirect(`/research/${data.id}`);
}

export async function updateResearchItem(id: string, formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("research_items").update(payloadFrom(formData)).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/research");
  revalidatePath(`/research/${id}`);
}

export async function deleteResearchItem(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("research_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/research");
  redirect("/research");
}
