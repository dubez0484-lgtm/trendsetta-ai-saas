# CLAUDE.md — THETRENDSETTA Project Policy

This file is permanent project policy. Every Claude Code session opened in
this repo reads this file first and operates under it for the duration of
the session.

> Note: this policy file was originally requested for a separate
> `ThetrendsettaOs` repo. That repo could not be created via this
> session's GitHub App connector — GitHub Apps cannot create
> repositories under a personal GitHub account (`dubez0484-lgtm`), only
> under organizations; this is a GitHub platform restriction, not a
> permission setting. By decision, this policy file lives here in
> `trendsetta-ai-saas` instead.
>
> **Update — 2026-08-26: `ThetrendsettaOs` now exists.** Zakhele created
> it directly via the GitHub UI (public, under `dubez0484-lgtm`, with a
> README), which sidesteps the App's org-only restriction. Verified this
> session: cloned successfully, commit `729bb1c`, contains only
> `README.md` so far — content/purpose for this repo still to be
> decided.

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

### Workspace migration verification — 2026-08-26

Zakhele reported that **Trendsetter OS** was remixed (with history) out of his
own Lovable account into **"Miish's Lovable"** workspace
(owner: lordmiish531@gmail.com, id `V76qlVB7HXtDLxl4FHZH`, pro plan) so it
sits under a paid plan, and connected to a new GitHub repo,
`dubez0484-lgtm/remix-of-trendsetter-os`. Verified directly this session:

| Check | Result |
|---|---|
| GitHub repo `dubez0484-lgtm/remix-of-trendsetter-os` | **Exists, reachable, cloned.** Full Vite/React/TS/Supabase scaffold (`src/`, `supabase/`, `package.json`, `vite.config.ts`). Single commit on `main`: "Add project README" (2026-08-26 01:00 UTC). Has a committed `.env` at root — checked contents: only `SUPABASE_PROJECT_ID` / `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` (anon/publishable key, safe to be public) — **not a secret leak**, unlike the `.env` files flagged in the other two repos in the 2026-08-25 audit above (those haven't been re-checked, still flagged). |
| Lovable project "Remix of Remix of Trendsetter OS" | **Exists** in the "Miish's Lovable" workspace, id `481368c2-232b-4046-8b78-12814b9f3f3d`, status `completed`/`ready`, live preview renders correctly (THETRENDSETTA landing page, cyberpunk-luxury styling matches brand system). `Miish's Lovable` is the only workspace visible to this session's connected Lovable account — matches the "moved to a paid plan under Miish" story. |
| Supabase connection | **✅ Resolved 2026-09-09 — the ref above was stale.** The live project is **`qcnwhabljcwulospklom`**, read directly from the live Lovable project's own `.env`. The old `qhsetblivjmpqzmpohad` was never reachable and is now corrected in `remix-of-trendsetter-os/.env` too. It is **not** in the connected Supabase account's project list because Lovable Cloud provisions and owns the Supabase project — so `mcp__Supabase__*` tools cannot see it. **Use `mcp__Lovable__query_database` for all DB work on this project**; it has elevated access and works. Schema verified live this way (lm_*, course_*, payfast_payments, user_roles all present). |

Rename cleanup still open: project displays as "Remix of Remix of Trendsetter
OS" — cosmetic, low priority.

## Reconciliation issue — partly resolved 2026-09-09

The second workspace was found. The Lovable account
`thetrendsettaofficial@gmail.com` ("Brain's Lovable", id
`onyWICzu7QWvq4LP0Klv`) holds **EOS School Studio** and **LekkerTable
Bookings** — two of the six projects previously thought missing. Also in
there: Trendsetter Funnel, Grant Navigator, Neon Studio AI, TikTok Video
Magic.

Still not located anywhere: **KasiOS, ComplyLink, Khumo, MEGA Link.** Do not
assume they don't exist — keep flagging until found.

### Lovable accounts — three of them, and the MCP connection flips between them

| Account | Workspaces | Sees the live Trendsetter OS project? |
|---|---|---|
| `dubez0484@gmail.com` (Zakhele Dube) | Zakhele's Lovable (owner), Miish's Lovable (member) | **Yes** — use this one |
| `lordmiish531@gmail.com` (Miish The Dj) | Miish's Lovable (owner) | Yes |
| `thetrendsettaofficial@gmail.com` (brain_trend) | Brain's Lovable (owner) | No — 404s on the project |

The connection alternates between these without warning. If a Lovable tool
returns `404 project_not_found`, call `get_me` first — it is almost always the
wrong account, not a missing project.

## Lovable Cloud: custom secrets never reach the app server

Confirmed empirically 2026-09-09, not assumed. Only Lovable's own managed
variables (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`) are injected into the app server's `process.env`.
Custom secrets added in Project Settings → Secrets go **only to Supabase Edge
Functions**, which this app does not use. `VITE_*` is a separate build-time
mechanism baked into the client bundle, so it must never hold a secret.

A diagnostic endpoint in the same process as the checkout handler returned
`SUPABASE_URL: true` with all four `PAYFAST_*: false`, after the secrets were
saved, the server restarted, and the app published. "Build secrets" in Project
Settings is Enterprise-gated on this plan and is not the answer either.

**Pattern to use instead:** put the credential in Supabase Vault and read it
through a `security definer` function granted only to `service_role` — see
`public.get_payfast_config()` and
`supabase/migrations/20260909190000_payfast_vault_config.sql` in
`remix-of-trendsetter-os`. Do not burn time re-testing env vars for this stack.
