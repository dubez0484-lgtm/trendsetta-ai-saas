"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ContentPlatform, ContentStatus } from "@/lib/supabase/types";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export async function createContentItem(formData: FormData) {
  const { supabase, user } = await requireUser();

  const keywordsRaw = String(formData.get("keywords") || "");
  const keywords = keywordsRaw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const payload = {
    owner_id: user.id,
    title: String(formData.get("title") || "Untitled"),
    platform: String(formData.get("platform")) as ContentPlatform,
    status: (String(formData.get("status") || "idea")) as ContentStatus,
    pillar_id: (formData.get("pillar_id") as string) || null,
    template_key: (formData.get("template_key") as string) || null,
    hook: (formData.get("hook") as string) || null,
    script: (formData.get("script") as string) || null,
    visual_direction: (formData.get("visual_direction") as string) || null,
    caption: (formData.get("caption") as string) || null,
    cta: (formData.get("cta") as string) || null,
    keywords,
    source_item_id: (formData.get("source_item_id") as string) || null,
    research_item_id: (formData.get("research_item_id") as string) || null,
    publish_date: (formData.get("publish_date") as string) || null,
    notes: (formData.get("notes") as string) || null,
  };

  const { data, error } = await supabase.from("content_items").insert(payload).select("id").single();
  if (error) throw new Error(error.message);

  revalidatePath("/pipeline");
  revalidatePath("/");
  redirect(`/content/${data.id}`);
}

export async function updateContentItem(id: string, formData: FormData) {
  const { supabase } = await requireUser();

  const keywordsRaw = String(formData.get("keywords") || "");
  const keywords = keywordsRaw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const payload = {
    title: String(formData.get("title") || "Untitled"),
    platform: String(formData.get("platform")) as ContentPlatform,
    status: String(formData.get("status")) as ContentStatus,
    pillar_id: (formData.get("pillar_id") as string) || null,
    hook: (formData.get("hook") as string) || null,
    script: (formData.get("script") as string) || null,
    visual_direction: (formData.get("visual_direction") as string) || null,
    caption: (formData.get("caption") as string) || null,
    cta: (formData.get("cta") as string) || null,
    keywords,
    publish_date: (formData.get("publish_date") as string) || null,
    published_url: (formData.get("published_url") as string) || null,
    notes: (formData.get("notes") as string) || null,
  };

  const { error } = await supabase.from("content_items").update(payload).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/pipeline");
  revalidatePath(`/content/${id}`);
  revalidatePath("/");
}

export async function setContentStatus(id: string, status: ContentStatus) {
  const { supabase } = await requireUser();
  const patch: Record<string, unknown> = { status };
  if (status === "published") patch.published_at = new Date().toISOString();
  const { error } = await supabase.from("content_items").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
  revalidatePath(`/content/${id}`);
  revalidatePath("/");
}

export async function repurposeContentItem(sourceId: string, platform: ContentPlatform, formData: FormData) {
  const { supabase, user } = await requireUser();

  const { data: source, error: sourceError } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", sourceId)
    .single();
  if (sourceError) throw new Error(sourceError.message);

  const payload = {
    owner_id: user.id,
    title: String(formData.get("title") || `${source.title} (repurposed)`),
    platform,
    status: "idea" as ContentStatus,
    pillar_id: source.pillar_id,
    template_key: (formData.get("template_key") as string) || null,
    research_item_id: source.research_item_id,
    source_item_id: sourceId,
    notes: `Repurposed from: ${source.title}`,
  };

  const { data, error } = await supabase.from("content_items").insert(payload).select("id").single();
  if (error) throw new Error(error.message);

  revalidatePath("/pipeline");
  redirect(`/content/${data.id}`);
}

export async function deleteContentItem(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("content_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
  revalidatePath("/");
  redirect("/pipeline");
}

export async function createPillar(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const { error } = await supabase.from("content_pillars").insert({
    owner_id: user.id,
    name,
    description: (formData.get("description") as string) || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
  revalidatePath("/content/new");
}
