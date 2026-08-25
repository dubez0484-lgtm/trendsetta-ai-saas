# CLAUDE.md — THETRENDSETTA Project Policy

This file is permanent project policy. Every Claude Code session opened in
this repo reads this file first and operates under it for the duration of
the session.

> Note: this policy file was originally requested for a separate
> `ThetrendsettaOs` repo. That repo could not be created — GitHub Apps
> (the connector this session uses) cannot create repositories under a
> personal GitHub account (`dubez0484-lgtm`), only under organizations;
> this is a GitHub platform restriction, not a permission setting. By
> decision, it lives here in `trendsetta-ai-saas` instead.

## Identity

Raimond Zakhele Dube (Zakhele Dube), founder of THETRENDSETTA™.
Mobile-first operator (Android, intermittent laptop access).
AI Systems Operator / Voice AI & Automation Specialist.

## Engineering Principles (non-negotiable)

- Production-ready code only — never demo/mock architecture when
  production is possible.
- Schema-first workflow: design DB schema → SQL migrations → RLS policies
  → indexes → verify relationships → build APIs → connect frontend.
  Never skip steps, never assume a table exists — always verify.
- Modular, type-safe, scalable MVP-to-enterprise architecture.
- Security by default: RLS enabled on every Supabase table, no exceptions.

## Stack

- **Frontend:** React, Next.js, TypeScript, Tailwind, Lovable (UI gen)
- **Backend:** Supabase, PostgreSQL, Edge Functions
- **Automation:** Make.com
- **Voice:** Vapi
- **AI:** Claude, OpenAI, Gemini, Replicate
- **Infra:** GitHub, Netlify/Vercel

## Brand system — Cyberpunk Luxury

Matte black background, electric neon blue accents, geometric typography,
soft glow, glassmorphism, mobile-first responsive by default.

## GitHub sync policy

- Every active Lovable project must sync to a matching-named GitHub repo
  via "Sync my code" — no project stays local-only.
- Before starting work in any repo, run a status check: file count,
  last commit, whether repo is empty (0 bytes = never synced, needs a
  fresh push from Lovable).
- Known repos and their real Lovable project mapping (fill in as confirmed):

| GitHub repo | Lovable project (workspace: Zakhele's Lovable) | Status |
|---|---|---|
| | | |

### Repo audit — 2026-08-25 (corrected)

Performed against the `dubez0484-lgtm` GitHub account (verified via GitHub
repo search) and the "Zakhele's Lovable" Lovable workspace
(id `7WteGo9p8DLQjgYYzrii`, 8 projects).

**Correction:** an earlier pass in this same session reported only 1 repo
on this account. That was wrong — it reflected a scoping limit on the
connected GitHub App's repository-access list (set to "Only select
repositories" → just `trendsetta-ai-saas`), not the account's actual
contents. Zakhele confirmed via the GitHub UI and widened the App's
repository access to all repos; the audit below is the corrected,
verified result. `ThetrendsettaOs` still does not exist and still can't
be created via this connector — that limitation (GitHub Apps can't create
repos under personal accounts) is real and unrelated to the scoping bug.

| Repo | Visibility | Files (root) | Size | Last commit | Status |
|---|---|---|---|---|---|
| `trendsetta-ai-saas` | Public | 1 (`README.md`) on `main`; this file lands via a merge from a feature branch | 0 KB | `166b6d2` "Initial commit" — 2026-08-18 | **Empty/stub** — never synced from Lovable |
| `thetrendsetta-app` | Private | 1 (`index.html`, ~20 KB) | 33 KB | "Create index.html" — 2026-05-24 | Has content — single static HTML file, not a Lovable-scaffolded project |
| `Thetrendsetta-system.app` | Private | Full Vite/React/TS/Supabase scaffold (`src/`, `supabase/`, `package.json`, etc.) | 547 KB | "Added checkout catalog & btn" (lovable-dev[bot]) — 2026-08-15 | **Actively synced from Lovable.** ⚠️ Has a committed `.env` (685 bytes) at root — check it for leaked secrets |
| `trendsetter-funnel` | Private | Full Vite/React/TS/Supabase scaffold, same shape as above | 232 KB | "Built THETRENDSETTA engine" (lovable-dev[bot]) — 2026-06-23 | **Actively synced from Lovable.** ⚠️ Also has a committed `.env` (685 bytes) at root — check it for leaked secrets |
| `thetrendsetta-system` | Private | 0 | 0 Bytes | none — repo has no commits at all | **Truly empty** — needs a fresh "Sync my code" push from its matching Lovable project |
| `ThetrendsettaOs` | — | — | — | — | **Does not exist, still can't be created** — GitHub Apps cannot create repos under personal GitHub accounts (platform restriction, not a permission gap) |

**Lovable workspace inventory** (`Zakhele's Lovable`, 8 projects; none
currently show a linked/synced GitHub repo — none have run "Sync my code"
yet):

| Lovable project | Display name |
|---|---|
| `trendsetta-ai-stack` | Trendsetter OS |
| `Sentinel's Reach` | Sentinel's Reach |
| `catering-perfection-page` | catering-perfection-page |
| `Client Copy Assistant` | Client Copy Assistant |
| `South African Compliance Hub` | South African Compliance Hub |
| `Claude Creator Hub` | Claude Creator Hub |
| `Trendsetter Opportunities` | Trendsetter Opportunities |
| `Project Exporter` | Project Exporter |

None of these names are confirmed matches for KasiOS, ComplyLink, Khumo,
LekkerTable, MEGA Link, or EOS School — see the open reconciliation issue
below. `South African Compliance Hub` and `catering-perfection-page` are
*possible* naming overlaps with ComplyLink and LekkerTable respectively,
but this is a guess, not a confirmed mapping — verify with Zakhele before
filling in the sync table above.

## Open reconciliation issue

KasiOS, ComplyLink, Khumo, LekkerTable, MEGA Link, and EOS School are
active THETRENDSETTA projects that do NOT currently appear in the
"Zakhele's Lovable" workspace or the `dubez0484-lgtm` GitHub account.
Do not assume they don't exist — flag this every session until resolved,
and ask whether a second account/workspace holds them.
