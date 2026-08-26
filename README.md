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

## Production deployment

1. Provision PostgreSQL, run `npm run prisma:deploy` (`prisma migrate deploy`) against it.
2. Set every variable in `.env.example` to real, production values — especially:
   - `TOKEN_ENCRYPTION_KEY` and `NEXTAUTH_SECRET`: freshly generated, stored in a secrets manager, never reused from development.
   - `META_GRAPH_API_VERSION`: verified current per `docs/META_SETUP.md`.
   - `MOCK_META=false`.
3. Deploy the Next.js app (`npm run build && npm run start`, or your platform's Next.js adapter).
4. Deploy `npm run mcp` as its own long-running process/service if AI-agent access is needed — it is not part of the Next.js server.
5. Point the Meta App Dashboard's webhook callback URL at your deployed `/api/webhooks/meta` and complete the checklist in `docs/META_SETUP.md` §8.

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
