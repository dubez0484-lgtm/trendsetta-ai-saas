# Meta Comment-to-DM Automation Engine

THETRENDSETTA™ — watches Instagram and Facebook comments, matches
configured keywords, and automatically sends the commenter a private DM.
Exposes an MCP server so AI agents (e.g. Claude) can create, manage, test,
and analyze automations.

## Architecture

```
/app
  /(dashboard)/dashboard      Dashboard UI (overview, accounts, automations, logs, settings)
  /api/auth                   NextAuth (app login) + Meta OAuth (connect Instagram/Facebook)
  /api/webhooks/meta          Meta webhook receiver (verification + comment events)
  /api/automations            Automation CRUD + manual test endpoint
  /api/accounts               Connected account listing/disconnect
  /api/analytics              Dashboard stats
/lib
  /meta                       All Meta Graph API I/O (client, oauth, messaging, webhook parsing)
  /mcp                        MCP server, tools, auth
  /auth                       NextAuth config + session helper
  /db                         Prisma client singleton
  /automation                 Matcher, execution engine, stats, Zod validation
  /security                   Token encryption, webhook signature validation, structured logging
  /errors                     Consistent API error shape
/prisma                       Schema + migrations
/components                   Dashboard/automation/account UI
/scripts                      Local mock-webhook test script
/tests                        Vitest unit + integration tests
/docs/META_SETUP.md           Meta app configuration, permissions, App Review
```

Every Meta HTTP call goes through `lib/meta/client.ts` — no route or
component calls `graph.facebook.com` directly. Every entry point that can
trigger a DM (webhook, dashboard "test automation", MCP) goes through the
same `lib/automation/engine.ts`, so behavior never drifts between them.

## Installation

```bash
npm install
```

Requires Node.js ≥ 18.18 and a PostgreSQL database.

## Environment variables

```bash
cp .env.example .env
```

Fill in every value — see `.env.example` for what each one is. At minimum
for local development:

- `DATABASE_URL` — a PostgreSQL connection string
- `NEXTAUTH_SECRET` — `openssl rand -base64 32`
- `TOKEN_ENCRYPTION_KEY` — `openssl rand -base64 32`
- `WEBHOOK_VERIFY_TOKEN` — any string you choose
- `MOCK_META=true` — so you can build/test without real Meta credentials

Real `META_APP_ID`/`META_APP_SECRET`/webhook subscription setup is
covered in **[docs/META_SETUP.md](docs/META_SETUP.md)** — read that before
attempting a real (non-mock) connection.

## Database setup

```bash
npx prisma generate       # or: npm run prisma:generate
npx prisma migrate dev    # or: npm run prisma:migrate
```

This creates: `User`, `Account`/`Session`/`VerificationToken` (NextAuth),
`SocialAccount`, `Automation`, `TriggerLog`, `WebhookEvent`, `McpApiKey`.
See `prisma/schema.prisma` for the full schema and enum values
(`SubscriptionTier`, `Platform`, `MatchType`, `TriggerStatus`).

## Local development

```bash
npm run dev
```

1. Visit `http://localhost:3000`, create an account (`/signup`).
2. With `MOCK_META=true`, go to `/dashboard/automations/new` — but you'll
   need a `SocialAccount` row to attach an automation to, and the OAuth
   connect flow requires real Meta credentials even in mock mode (only
   the *send* step is mocked, not account discovery). For pure local
   testing without any Meta app at all, insert a test `SocialAccount` row
   directly (e.g. via `npx prisma studio`) with any `platform`/`accountId`,
   then create an automation against it and use the mock webhook script
   below.
3. Run the typecheck/lint/tests as you go — see **Testing**.

## Mock Meta mode

Set `MOCK_META=true` (default in `.env.example`). With it set,
`sendInstagramPrivateReply` / `sendFacebookPrivateReply`
(`lib/meta/messaging.ts`) never call Meta — they return a simulated
success immediately. This lets you exercise the full webhook → matcher →
engine → DM → `TriggerLog` path with zero Meta App Review and zero real
credentials.

Send a realistic, correctly-signed mock comment webhook to your running
dev server:

```bash
npm run mock:webhook -- --platform=instagram --comment="I want the link" --accountId=<your SocialAccount.accountId>
npm run mock:webhook -- --platform=facebook  --comment="send me the link" --accountId=<your SocialAccount.accountId>
```

See `scripts/test-meta-webhook.ts`. `accountId` must match an existing
`SocialAccount.accountId` (with an active `Automation` attached) for the
event to actually trigger something — otherwise you'll correctly see a
`SKIPPED` result, which is the engine behaving as designed for an unknown
account.

## Meta Developer setup, OAuth setup, webhook setup

Fully documented in **[docs/META_SETUP.md](docs/META_SETUP.md)**: creating
the app, Facebook Login + Instagram/Webhooks products, exact permissions
required, webhook subscription, and the App Review requirements for
onboarding accounts you don't own.

## MCP setup

```bash
npm run mcp
```

Starts a standalone HTTP server on `MCP_SERVER_PORT` (default `3001`)
implementing the Model Context Protocol (Streamable HTTP transport,
stateless). Every request requires:

```
Authorization: Bearer <token>
```

For initial single-tenant deployment, set `MCP_AUTH_TOKEN` (a random
secret) and `MCP_AUTH_USER_EMAIL` (the app-login email of the user whose
automations the token can manage) — `lib/mcp/auth.ts` validates the token
and resolves that one user. The `McpApiKey` table exists so this can grow
into real per-user API keys later without a schema change: a bearer token
matching a hashed `McpApiKey` row resolves directly to that key's owner,
independent of the shared token.

Tools exposed (`lib/mcp/server.ts`, implementations in `lib/mcp/tools.ts`):

- **`create_automation`** — `{ keyword, replyMessage, linkUrl?, platform, matchType }`. Attaches to the caller's most recently connected account for that platform; the MCP client can never specify a `userId` or another user's account.
- **`list_automations`** — returns id, keyword, platform, active status, reply message, and trigger/success/failure counts for the authenticated user's automations only.
- **`get_automation_stats`** — `{ automationId }`. Returns total triggers, successful/failed DMs, success rate, top keywords, and recent logs. Conversion tracking (did the DM recipient actually convert?) is explicitly reported as `"unavailable"` with an explanation of what additional tracking it would require — this schema records DM delivery attempts, not post-send recipient behavior, and this tool does not fabricate a number to fill the gap.

## Testing

```bash
npm test
```

Runs Vitest: matcher (case-insensitive/exact/regex/no-match/malformed
regex/ReDoS-shaped-pattern rejection), webhook signature validation
(valid/invalid/tampered/missing), webhook payload parsing (Instagram +
Facebook shapes, malformed input), the full webhook route (verification
handshake, signature rejection, malformed JSON, end-to-end match → mock
DM → `TriggerLog`, duplicate-delivery idempotency), the automation
engine directly (match/no-match/disabled/unknown-account/duplicate/
first-match-wins), and the MCP layer (auth token validation, tool
authorization boundaries, "never trust a client-supplied userId").

Integration tests run against a real local PostgreSQL database (the same
`DATABASE_URL` as development) rather than mocking Prisma — the schema's
unique constraints and cascades are core to what's being tested (webhook
idempotency, duplicate-comment prevention). Vitest is configured with
`fileParallelism: false` (`vitest.config.ts`) since test files share and
reset that one database.

## Production deployment (Vercel)

Vercel is the native host for Next.js App Router and gives a real HTTPS
URL immediately, which Meta's webhook requires (it will not deliver to
`localhost`). This connects your existing GitHub repo — no separate
account setup beyond signing in with GitHub.

1. Go to https://vercel.com and sign in with the GitHub account that owns
   this repo (`dubez0484-lgtm/trendsetta-ai-saas`).
2. **Add New → Project**, select this repo, branch
   `claude/meta-comment-dm-engine-r7prm8` (or your default branch once
   merged). Vercel auto-detects Next.js — leave the build command as
   `next build` (already the `npm run build` script) and the install
   command as `npm install` (this repo's `postinstall` already runs
   `prisma generate`, so no extra build-command changes are needed).
3. Before the first deploy, add every variable from `.env.example` under
   **Project Settings → Environment Variables** (Production environment),
   with real values:
   - `DATABASE_URL` — from your Postgres provider (see below).
   - `NEXTAUTH_SECRET` — `openssl rand -base64 32`.
   - `NEXTAUTH_URL` — your Vercel URL once known, e.g. `https://your-project.vercel.app` (you can add this after the first deploy gives you the URL, then redeploy).
   - `META_APP_ID`, `META_APP_SECRET`, `META_GRAPH_API_VERSION`, `META_REDIRECT_URI` — from `docs/META_SETUP.md`.
   - `WEBHOOK_VERIFY_TOKEN`, `TOKEN_ENCRYPTION_KEY` — your own generated values.
   - `MCP_AUTH_TOKEN`, `MCP_AUTH_USER_EMAIL` — your own; note the MCP server (`npm run mcp`) is a separate long-running process, not deployed by Vercel's serverless functions — run it elsewhere (a small VM/container) if AI-agent access is needed against production data.
   - `MOCK_META=false`.
4. Run the Prisma migration against your production database **before or
   right after** the first deploy: `npx prisma migrate deploy` from a
   machine that can reach the database (or apply the SQL in
   `prisma/migrations/20260826095034_init/migration.sql` directly via your
   Postgres provider's SQL console — this is exactly what the migration
   does).
5. Deploy. Vercel gives you a `https://<project>.vercel.app` URL —
   confirm `GET https://<project>.vercel.app/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=<your token>&hub.challenge=123` returns `123` before configuring it in the Meta App Dashboard.
6. Point the Meta App Dashboard's webhook callback URL at
   `https://<project>.vercel.app/api/webhooks/meta` and complete the
   checklist in `docs/META_SETUP.md`.

(Netlify is also viable per this project's stack policy — same env vars,
their Next.js runtime adapter handles the App Router API routes.)

## Security checklist

- [x] Meta access/refresh tokens encrypted at rest (AES-256-GCM, `lib/security/encryption.ts`) — never stored or logged in plaintext.
- [x] Webhook signature (`X-Hub-Signature-256`) validated on every delivery before any payload data is trusted (`lib/security/webhook-signature.ts`).
- [x] Structured logger redacts tokens/secrets/passwords by key name automatically (`lib/security/logger.ts`).
- [x] Every `/api/automations`, `/api/accounts`, `/api/analytics` route derives the user from the server session (`getCurrentUserId`) — a client-supplied `userId` is never trusted.
- [x] MCP tools resolve the user from the validated bearer token, never from tool input.
- [x] Access tokens are never selected/returned by `GET /api/accounts` (explicit field allowlist, no `select: *`).
- [x] Regex automations are guarded against catastrophic-backtracking shapes before execution (`lib/automation/matcher.ts`).
- [x] Webhook idempotency: Meta retries are deduplicated via a unique `WebhookEvent.eventId`, and the engine independently deduplicates by `(socialAccountId, commentId)`.
- [ ] Rotate `TOKEN_ENCRYPTION_KEY`/`NEXTAUTH_SECRET`/`MCP_AUTH_TOKEN` on any suspected exposure — this requires a manual re-encryption migration for existing `SocialAccount` rows if `TOKEN_ENCRYPTION_KEY` changes (not automated by this codebase).

## Known Meta restrictions

See **[docs/META_SETUP.md](docs/META_SETUP.md)** in full. In short: Meta
gates real (non-mock) comment/messaging access behind app configuration
and, for accounts you don't own, App Review; private replies only work
within a limited time window after a comment is posted and generally only
once per comment; Instagram automation requires a Professional account
linked to a Facebook Page. **Live Instagram/Facebook DM delivery is not
claimed to work until tested against real Meta credentials, permissions,
and an approved webhook subscription** — this codebase implements the
real integration, correctly built against Meta's documented API surface,
but has not itself completed Meta's review/verification process.
