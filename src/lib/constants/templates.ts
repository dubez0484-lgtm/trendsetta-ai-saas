import type { ContentPlatform } from "@/lib/supabase/types";

export interface ContentTemplate {
  key: string;
  platform: ContentPlatform;
  name: string;
  description: string;
  fields: string[];
}

export const TIKTOK_TEMPLATES: ContentTemplate[] = [
  { key: "tt_educational_workflow", platform: "tiktok", name: "Educational Workflow", description: "Teach one specific workflow step-by-step.", fields: ["hook", "3-second opening", "script", "visual direction", "cta", "caption", "keywords"] },
  { key: "tt_build_in_public", platform: "tiktok", name: "Build-in-Public", description: "Show real progress on THETRENDSETTA in the moment.", fields: ["hook", "3-second opening", "script", "visual direction", "cta", "caption", "keywords"] },
  { key: "tt_ai_business_case", platform: "tiktok", name: "AI Business Case", description: "A concrete AI use case with a measurable (sourced) result.", fields: ["hook", "3-second opening", "script", "visual direction", "cta", "caption", "keywords"] },
  { key: "tt_founder_story", platform: "tiktok", name: "Founder Story", description: "Personal narrative that builds trust and identity.", fields: ["hook", "3-second opening", "script", "visual direction", "cta", "caption", "keywords"] },
  { key: "tt_hot_take", platform: "tiktok", name: "Hot Take", description: "A clearly-labelled opinion on the industry.", fields: ["hook", "3-second opening", "script", "visual direction", "cta", "caption", "keywords"] },
  { key: "tt_before_after", platform: "tiktok", name: "Before / After", description: "Contrast state before vs. after an AI system.", fields: ["hook", "3-second opening", "script", "visual direction", "cta", "caption", "keywords"] },
  { key: "tt_screen_recording", platform: "tiktok", name: "Screen-Recording Tutorial", description: "Walk through a real screen / tool in action.", fields: ["hook", "3-second opening", "script", "visual direction", "cta", "caption", "keywords"] },
  { key: "tt_voice_over", platform: "tiktok", name: "Voice-Over Workflow", description: "Voice-over narrating a build or process.", fields: ["hook", "3-second opening", "script", "visual direction", "cta", "caption", "keywords"] },
  { key: "tt_case_study", platform: "tiktok", name: "Case Study", description: "A sourced result from a real client/build.", fields: ["hook", "3-second opening", "script", "visual direction", "cta", "caption", "keywords"] },
];

export const LINKEDIN_TEMPLATES: ContentTemplate[] = [
  { key: "li_founder_insight", platform: "linkedin", name: "Founder Insight", description: "A lesson learned from operating THETRENDSETTA.", fields: ["hook", "body", "cta", "visual", "supporting evidence", "source references"] },
  { key: "li_ai_strategy", platform: "linkedin", name: "AI Strategy", description: "Strategic point of view on applying AI in business.", fields: ["hook", "body", "cta", "visual", "supporting evidence", "source references"] },
  { key: "li_workflow_breakdown", platform: "linkedin", name: "Workflow Breakdown", description: "Step-by-step breakdown of a real operational workflow.", fields: ["hook", "body", "cta", "visual", "supporting evidence", "source references"] },
  { key: "li_case_study", platform: "linkedin", name: "Case Study", description: "Sourced result narrative with evidence.", fields: ["hook", "body", "cta", "visual", "supporting evidence", "source references"] },
  { key: "li_market_analysis", platform: "linkedin", name: "Market Analysis", description: "Analysis of a market trend or shift, sourced.", fields: ["hook", "body", "cta", "visual", "supporting evidence", "source references"] },
  { key: "li_african_tech", platform: "linkedin", name: "African Technology", description: "Commentary on African tech/business ecosystem.", fields: ["hook", "body", "cta", "visual", "supporting evidence", "source references"] },
  { key: "li_operational_lesson", platform: "linkedin", name: "Operational Lesson", description: "A specific lesson from running operations.", fields: ["hook", "body", "cta", "visual", "supporting evidence", "source references"] },
  { key: "li_build_in_public", platform: "linkedin", name: "Build-in-Public", description: "Progress update written for a LinkedIn audience.", fields: ["hook", "body", "cta", "visual", "supporting evidence", "source references"] },
  { key: "li_opinion", platform: "linkedin", name: "Opinion", description: "A clearly-labelled opinion piece.", fields: ["hook", "body", "cta", "visual", "supporting evidence", "source references"] },
  { key: "li_framework", platform: "linkedin", name: "Framework", description: "An original framework/model, presented as reusable.", fields: ["hook", "body", "cta", "visual", "supporting evidence", "source references"] },
];

export const ALL_TEMPLATES = [...TIKTOK_TEMPLATES, ...LINKEDIN_TEMPLATES];

export function getTemplate(key: string | null | undefined): ContentTemplate | undefined {
  if (!key) return undefined;
  return ALL_TEMPLATES.find((t) => t.key === key);
}

export function templatesForPlatform(platform: ContentPlatform): ContentTemplate[] {
  if (platform === "tiktok") return TIKTOK_TEMPLATES;
  if (platform === "linkedin") return LINKEDIN_TEMPLATES;
  return [];
}
