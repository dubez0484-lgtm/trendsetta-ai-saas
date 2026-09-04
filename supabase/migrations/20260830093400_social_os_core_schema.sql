-- THETRENDSETTA Social Media OS — core schema
-- Additive only: does not touch any existing table in this project
-- (accounts, sessions, users, verification_tokens, social_accounts,
-- automations, trigger_logs, webhook_events, mcp_api_keys, workspaces,
-- workspace_memberships, products, workspace_products, subscriptions
-- belong to a separate, pre-existing application and are left untouched).
--
-- Auth model: Supabase Auth (auth.users / auth.uid()), single operator.
-- Every table owner-scoped and RLS-enabled, no exceptions.

create extension if not exists "pgcrypto";

create type content_platform as enum ('tiktok', 'linkedin', 'threads_x');

create type content_status as enum (
  'idea', 'research', 'script', 'record', 'edit',
  'ready', 'published', 'analytics', 'repurpose', 'learn'
);

create type claim_type as enum ('fact', 'hypothesis', 'opinion');

create type review_verdict as enum ('keep', 'kill', 'double_down', 'test');

create type lead_stage as enum (
  'comment_cta', 'lead_magnet', 'conversation', 'qualification', 'opportunity'
);

-- ---------------------------------------------------------------------
-- Content pillars
-- ---------------------------------------------------------------------
create table content_pillars (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create index content_pillars_owner_idx on content_pillars(owner_id);

alter table content_pillars enable row level security;

create policy "content_pillars_owner_all" on content_pillars
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------
-- Research items — fact / hypothesis / opinion, never auto-published as fact
-- ---------------------------------------------------------------------
create table research_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  source text,
  source_url text,
  claim text,
  claim_type claim_type not null default 'hypothesis',
  evidence text,
  competitor text,
  trend text,
  opportunity text,
  confidence smallint check (confidence between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index research_items_owner_idx on research_items(owner_id);
create index research_items_claim_type_idx on research_items(owner_id, claim_type);

alter table research_items enable row level security;

create policy "research_items_owner_all" on research_items
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------
-- Content items — the pipeline + 1-to-many content engine
-- ---------------------------------------------------------------------
create table content_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  platform content_platform not null,
  status content_status not null default 'idea',
  pillar_id uuid references content_pillars(id) on delete set null,
  template_key text,
  hook text,
  script text,
  visual_direction text,
  caption text,
  cta text,
  keywords text[] not null default '{}',
  source_item_id uuid references content_items(id) on delete set null,
  research_item_id uuid references research_items(id) on delete set null,
  publish_date date,
  published_at timestamptz,
  published_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index content_items_owner_idx on content_items(owner_id);
create index content_items_status_idx on content_items(owner_id, status);
create index content_items_platform_idx on content_items(owner_id, platform);
create index content_items_source_idx on content_items(source_item_id);
create index content_items_publish_date_idx on content_items(owner_id, publish_date);

alter table content_items enable row level security;

create policy "content_items_owner_all" on content_items
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------
-- Competitor intelligence
-- ---------------------------------------------------------------------
create table competitors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  platform text,
  positioning text,
  content_pillars text,
  content_format text,
  engagement_observations text,
  interesting_hooks text,
  market_gap text,
  notes text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index competitors_owner_idx on competitors(owner_id);

alter table competitors enable row level security;

create policy "competitors_owner_all" on competitors
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------
-- Analytics — one row per content item per capture date
-- ---------------------------------------------------------------------
create table content_analytics (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  content_item_id uuid not null references content_items(id) on delete cascade,
  platform content_platform not null,
  captured_at date not null default current_date,
  views integer,
  watch_time_seconds integer,
  completion_rate numeric(5, 2),
  likes integer,
  comments integer,
  shares integer,
  saves integer,
  impressions integer,
  reactions integer,
  reposts integer,
  profile_visits integer,
  followers_gained integer,
  dms integer,
  leads integer,
  created_at timestamptz not null default now()
);

create index content_analytics_owner_idx on content_analytics(owner_id);
create index content_analytics_item_idx on content_analytics(content_item_id);
create index content_analytics_captured_idx on content_analytics(owner_id, captured_at);

alter table content_analytics enable row level security;

create policy "content_analytics_owner_all" on content_analytics
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------
-- Lead magnets + leads (content -> lead funnel)
-- ---------------------------------------------------------------------
create table lead_magnets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  delivery_url text,
  created_at timestamptz not null default now()
);

create index lead_magnets_owner_idx on lead_magnets(owner_id);

alter table lead_magnets enable row level security;

create policy "lead_magnets_owner_all" on lead_magnets
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create table leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text,
  contact text,
  source_item_id uuid references content_items(id) on delete set null,
  lead_magnet_id uuid references lead_magnets(id) on delete set null,
  stage lead_stage not null default 'comment_cta',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_owner_idx on leads(owner_id);
create index leads_stage_idx on leads(owner_id, stage);

alter table leads enable row level security;

create policy "leads_owner_all" on leads
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------
-- Weekly review — KEEP / KILL / DOUBLE DOWN / TEST
-- ---------------------------------------------------------------------
create table weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  content_item_id uuid not null references content_items(id) on delete cascade,
  verdict review_verdict not null,
  reasoning text,
  created_at timestamptz not null default now()
);

create index weekly_reviews_owner_idx on weekly_reviews(owner_id);
create index weekly_reviews_week_idx on weekly_reviews(owner_id, week_start);

alter table weekly_reviews enable row level security;

create policy "weekly_reviews_owner_all" on weekly_reviews
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------
create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger research_items_set_updated_at before update on research_items
  for each row execute function set_updated_at();
create trigger content_items_set_updated_at before update on content_items
  for each row execute function set_updated_at();
create trigger competitors_set_updated_at before update on competitors
  for each row execute function set_updated_at();
create trigger leads_set_updated_at before update on leads
  for each row execute function set_updated_at();
