# THETRENDSETTA™ Social Media OS

A mobile-first internal operating system for managing THETRENDSETTA™'s content
pipeline, research, competitor intelligence, analytics, lead funnel, and
weekly optimization review — across TikTok, LinkedIn, and Threads/X.

Manual/mobile publishing workflow by design: no direct platform publishing
API is wired up (per project policy, none is required — copy buttons make
manual publishing fast).

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres + Auth), accessed via `@supabase/ssr`
- Server Actions for all mutations — no separate API layer

## Architecture notes

This repo was empty before this build (no framework, schema, auth, or
design system existed). The Supabase project backing this app —
**"Orange restaurant Demo"** (`qpngoxqhjshzgbuxvzkx`), chosen by the
operator from the projects available in the THETRENDSETTA™ Supabase
organization — already hosts an **unrelated, pre-existing application**:
a NextAuth-based social-DM-automation tool (`users`, `accounts`,
`sessions`, `verification_tokens`, `social_accounts`, `automations`,
`trigger_logs`, `webhook_events`, `mcp_api_keys`, `workspaces`,
`workspace_memberships`, `products`, `subscriptions`). None of that was
touched. This app's tables are additive, separately named, and use
**Supabase Auth** (`auth.users` / `auth.uid()`) rather than that other
app's NextAuth tables — the two systems coexist in the same database
without collision.

## Database

Schema lives in `supabase/migrations/`. Every table is owner-scoped
(`owner_id uuid references auth.users`) with row level security enabled
and a single `owner_id = auth.uid()` policy for all operations — no
exceptions, per project policy.

Tables: `content_pillars`, `content_items`, `research_items`,
`competitors`, `content_analytics`, `lead_magnets`, `leads`,
`weekly_reviews`.

To apply migrations to a different Supabase project, run the SQL files
in `supabase/migrations/` in order against that project (via the
Supabase SQL editor, the CLI, or the Supabase MCP `apply_migration` tool).

## Local development

```bash
cp .env.example .env.local   # already populated for the Orange restaurant Demo project
npm install
npm run dev
```

Sign up with an email/password on `/login` — Supabase sends a
confirmation email by default; confirm before signing in. (If email
confirmations are disabled on the project, sign-in works immediately
after sign-up.)

## Content model

- **Pipeline**: `idea → research → script → record → edit → ready →
  published → analytics → repurpose → learn`, tracked as `status` on
  each content item.
- **1-to-many content engine**: any content item can be repurposed into
  a new item on another platform via `source_item_id`, so one core build
  can fan out into TikTok, LinkedIn, and Threads/X assets.
- **Research**: every claim is tagged `fact`, `hypothesis`, or `opinion`
  and defaults to `hypothesis` — nothing becomes a published claim
  automatically.
- **Weekly review**: published content is scored `Keep / Kill / Double
  Down / Test` to drive the optimization loop.
- **Leads**: `comment/CTA → lead magnet → conversation → qualification →
  opportunity`, with leads linkable to both the content item and lead
  magnet that produced them.

## What still requires manual action

- Confirm the operator's Supabase Auth account (email confirmation).
- Deploy (Vercel/Netlify) and set `NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables there.
- TikTok/LinkedIn account creation and verification stay outside this
  system, by design (per project policy) — this app is the infrastructure
  around those accounts, not a replacement for controlling them.

See `CLAUDE.md` for full project policy and the open reconciliation
issue (KasiOS, ComplyLink, Khumo, LekkerTable, MEGA Link, EOS School).
