export type ContentPlatform = "tiktok" | "linkedin" | "threads_x";

export type ContentStatus =
  | "idea"
  | "research"
  | "script"
  | "record"
  | "edit"
  | "ready"
  | "published"
  | "analytics"
  | "repurpose"
  | "learn";

export type ClaimType = "fact" | "hypothesis" | "opinion";

export type ReviewVerdict = "keep" | "kill" | "double_down" | "test";

export type LeadStage =
  | "comment_cta"
  | "lead_magnet"
  | "conversation"
  | "qualification"
  | "opportunity";

export interface ContentPillar {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ContentItem {
  id: string;
  owner_id: string;
  title: string;
  platform: ContentPlatform;
  status: ContentStatus;
  pillar_id: string | null;
  template_key: string | null;
  hook: string | null;
  script: string | null;
  visual_direction: string | null;
  caption: string | null;
  cta: string | null;
  keywords: string[];
  source_item_id: string | null;
  research_item_id: string | null;
  publish_date: string | null;
  published_at: string | null;
  published_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResearchItem {
  id: string;
  owner_id: string;
  topic: string;
  source: string | null;
  source_url: string | null;
  claim: string | null;
  claim_type: ClaimType;
  evidence: string | null;
  competitor: string | null;
  trend: string | null;
  opportunity: string | null;
  confidence: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Competitor {
  id: string;
  owner_id: string;
  name: string;
  platform: string | null;
  positioning: string | null;
  content_pillars: string | null;
  content_format: string | null;
  engagement_observations: string | null;
  interesting_hooks: string | null;
  market_gap: string | null;
  notes: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentAnalytics {
  id: string;
  owner_id: string;
  content_item_id: string;
  platform: ContentPlatform;
  captured_at: string;
  views: number | null;
  watch_time_seconds: number | null;
  completion_rate: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  impressions: number | null;
  reactions: number | null;
  reposts: number | null;
  profile_visits: number | null;
  followers_gained: number | null;
  dms: number | null;
  leads: number | null;
  created_at: string;
}

export interface LeadMagnet {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  delivery_url: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  owner_id: string;
  name: string | null;
  contact: string | null;
  source_item_id: string | null;
  lead_magnet_id: string | null;
  stage: LeadStage;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyReview {
  id: string;
  owner_id: string;
  week_start: string;
  content_item_id: string;
  verdict: ReviewVerdict;
  reasoning: string | null;
  created_at: string;
}
