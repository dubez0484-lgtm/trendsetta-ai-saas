"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LeadStage } from "@/lib/supabase/types";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export async function createLead(formData: FormData) {
  const { supabase, user } = await requireUser();
  const payload = {
    owner_id: user.id,
    name: (formData.get("name") as string) || null,
    contact: (formData.get("contact") as string) || null,
    source_item_id: (formData.get("source_item_id") as string) || null,
    lead_magnet_id: (formData.get("lead_magnet_id") as string) || null,
    stage: (String(formData.get("stage") || "comment_cta")) as LeadStage,
    notes: (formData.get("notes") as string) || null,
  };
  const { error } = await supabase.from("leads").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/leads");
}

export async function updateLeadStage(id: string, stage: LeadStage) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("leads").update({ stage }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/leads");
}

export async function deleteLead(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/leads");
}

export async function createLeadMagnet(formData: FormData) {
  const { supabase, user } = await requireUser();
  const payload = {
    owner_id: user.id,
    name: String(formData.get("name") || "Untitled"),
    description: (formData.get("description") as string) || null,
    delivery_url: (formData.get("delivery_url") as string) || null,
  };
  const { error } = await supabase.from("lead_magnets").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/lead-magnets");
  revalidatePath("/leads");
}

export async function deleteLeadMagnet(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("lead_magnets").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/lead-magnets");
}
