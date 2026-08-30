import type { ContentPlatform, ContentStatus, ReviewVerdict, LeadStage, ClaimType } from "@/lib/supabase/types";

export const PIPELINE_STAGES: { key: ContentStatus; label: string }[] = [
  { key: "idea", label: "Idea" },
  { key: "research", label: "Research" },
  { key: "script", label: "Script" },
  { key: "record", label: "Record" },
  { key: "edit", label: "Edit" },
  { key: "ready", label: "Ready" },
  { key: "published", label: "Published" },
  { key: "analytics", label: "Analytics" },
  { key: "repurpose", label: "Repurpose" },
  { key: "learn", label: "Learn" },
];

export const STATUS_LABEL: Record<ContentStatus, string> = Object.fromEntries(
  PIPELINE_STAGES.map((s) => [s.key, s.label])
) as Record<ContentStatus, string>;

export const PLATFORMS: { key: ContentPlatform; label: string }[] = [
  { key: "tiktok", label: "TikTok" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "threads_x", label: "Threads / X" },
];

export const PLATFORM_LABEL: Record<ContentPlatform, string> = Object.fromEntries(
  PLATFORMS.map((p) => [p.key, p.label])
) as Record<ContentPlatform, string>;

export const REVIEW_VERDICTS: { key: ReviewVerdict; label: string }[] = [
  { key: "keep", label: "Keep" },
  { key: "kill", label: "Kill" },
  { key: "double_down", label: "Double Down" },
  { key: "test", label: "Test" },
];

export const LEAD_STAGES: { key: LeadStage; label: string }[] = [
  { key: "comment_cta", label: "Comment / CTA" },
  { key: "lead_magnet", label: "Lead Magnet" },
  { key: "conversation", label: "Conversation" },
  { key: "qualification", label: "Qualification" },
  { key: "opportunity", label: "Opportunity" },
];

export const CLAIM_TYPES: { key: ClaimType; label: string }[] = [
  { key: "fact", label: "Fact" },
  { key: "hypothesis", label: "Hypothesis" },
  { key: "opinion", label: "Opinion" },
];
