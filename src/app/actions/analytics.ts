"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ContentPlatform } from "@/lib/supabase/types";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

function numOrNull(formData: FormData, key: string) {
  const raw = formData.get(key) as string;
  if (raw === null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function logAnalytics(contentItemId: string, platform: ContentPlatform, formData: FormData) {
  const { supabase, user } = await requireUser();

  const payload = {
    owner_id: user.id,
    content_item_id: contentItemId,
    platform,
    captured_at: (formData.get("captured_at") as string) || new Date().toISOString().slice(0, 10),
    views: numOrNull(formData, "views"),
    watch_time_seconds: numOrNull(formData, "watch_time_seconds"),
    completion_rate: numOrNull(formData, "completion_rate"),
    likes: numOrNull(formData, "likes"),
    comments: numOrNull(formData, "comments"),
    shares: numOrNull(formData, "shares"),
    saves: numOrNull(formData, "saves"),
    impressions: numOrNull(formData, "impressions"),
    reactions: numOrNull(formData, "reactions"),
    reposts: numOrNull(formData, "reposts"),
    profile_visits: numOrNull(formData, "profile_visits"),
    followers_gained: numOrNull(formData, "followers_gained"),
    dms: numOrNull(formData, "dms"),
    leads: numOrNull(formData, "leads"),
  };

  const { error } = await supabase.from("content_analytics").insert(payload);
  if (error) throw new Error(error.message);

  revalidatePath("/analytics");
  revalidatePath(`/content/${contentItemId}`);
}
