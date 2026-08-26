# Meta Developer Setup

This app talks to Instagram and Facebook through the **Meta Graph API**.
None of that works with real accounts until you complete this — until
then, run in [mock mode](../README.md#mock-meta-mode) (`MOCK_META=true`).

> **Honesty note on this document's accuracy.** This session's environment
> blocks direct network access to `developers.facebook.com` (network
> egress proxy), so every claim below about current API versions,
> permission names, and console structure comes from secondary sources
> (developer blogs, changelogs mirrored elsewhere) checked on **2026-08-26**,
> not a live fetch of Meta's own docs. Meta also redesigns its App
> Dashboard UI periodically, and this document cannot see today's actual
> screen. Treat every "click X" step as **"find the control that does
> X — the exact label/position may differ"**, not a pixel-perfect script.
> Where a step matters for correctness (not just UI navigation), it's
> called out. If a step here doesn't match what you see, the App
> Dashboard's own in-context help/search is more current than this file.

## What changed since this app was first built (verified this session)

- **Graph API version**: the code previously defaulted to `v19.0`, then
  `v21.0`. Neither is current. Best-corroborated current value as of
  2026-08-26 is **`v25.0`** (released Feb 18, 2026; each version is
  supported for ~2 years from release) — `v26.0` (~late July 2026) also
  exists. The default in `lib/meta/client.ts` and `.env.example` is now
  `v25.0`. **Confirm the exact current version yourself** at
  https://developers.facebook.com/docs/graph-api/changelog before going
  live — this is a 30-second check and it's the one fact in this doc you
  should trust least.
- **Instagram permission names changed and the old ones are now
  retired**: `instagram_basic`, `instagram_manage_comments`, and
  `instagram_manage_messages` were deprecated **January 27, 2025**. Using
  them today will fail to grant access. This app's OAuth scope list
  (`lib/meta/oauth.ts`) has been updated to the current names:
  `instagram_business_basic`, `instagram_business_manage_comments`,
  `instagram_business_manage_messages`. **This was a real bug, now
  fixed** — not just a documentation update.
- Facebook Page permissions (`pages_show_list`, `pages_read_engagement`,
  `pages_manage_engagement`, `pages_manage_metadata`, `pages_messaging`,
  `business_management`) were not renamed and are unchanged.
- The webhook payload shapes this app's parser expects
  (`lib/meta/webhook-parser.ts`) — Instagram `comments` field
  (`value.id`, `value.text`, `value.from.{id,username}`, `value.media.id`)
  and Facebook `feed` field (`value.item`, `value.verb`, `value.comment_id`,
  `value.post_id`, `value.message`, `value.from.{id,name}`) — match current
  documented examples. **No parser change was needed.** This will be
  re-verified against a real delivery in Step 8 below, since a live
  payload is the only real proof.

## Which integration path this app uses

Meta currently documents two ways to reach Instagram:

- **Instagram API with Facebook Login** (a.k.a. the Instagram Graph API) —
  for an Instagram Professional (Business/Creator) account **linked to a
  Facebook Page**. Auth goes through Facebook Login; you get Page + linked
  IG account together.
- **Instagram API with Instagram Login** — for an Instagram professional
  account with **no linked Facebook Page**. Different OAuth flow, different
  app product.

This app implements the first one (`lib/meta/oauth.ts`:
`discoverPagesAndInstagramAccounts` calls `GET /me/accounts` then
`GET /{page-id}?fields=instagram_business_account`) — it is the correct
choice if your Instagram account is (or will be) linked to a Facebook
Page, which is the common case and matches "connect your Facebook Page,
we discover the linked Instagram account" in this app's `/dashboard/accounts`
UI. If your Instagram account has no linked Page, this app's current OAuth
flow will not find it — that would be a separate integration, not
something to work around by guessing at the other flow.

---

## META DEVELOPER CONSOLE

### 1. Create the app

1. Go to https://developers.facebook.com/apps.
2. Create a new app. When asked what the app is for, choose the option
   for a business/company use case (not "consumer" or a game) — this is
   what unlocks Page/Instagram management products.
3. Name it (e.g. "THETRENDSETTA Comment-to-DM Engine").
4. Once created, go to the app's **Settings → Basic** page.
5. Copy the **App ID** → put it in `.env` as `META_APP_ID`.
6. Click "Show" next to **App Secret**, copy it → put it in `.env` as
   `META_APP_SECRET`. **Never commit this or paste it anywhere but your
   own `.env` / hosting provider's secret store.**

### 2. Add Facebook Login

1. From the app's product list, add **Facebook Login for Business**.
2. In its settings, find **Valid OAuth Redirect URIs** and add:
   - Production: `https://YOUR-DOMAIN/api/auth/meta/callback`
   - Local dev (only useful once you also have a way to receive the
     redirect locally): `http://localhost:3000/api/auth/meta/callback`
3. Put the exact production URL into `.env` as `META_REDIRECT_URI`. It
   must byte-for-byte match what's configured here, or the OAuth exchange
   fails.

### 3. Add the Instagram product

1. Add the **Instagram** product (Meta has used names like "Instagram
   Graph API" / "Instagram API with Facebook Login" / just "Instagram" —
   look for the one described as connecting via Facebook Login, not the
   standalone "Instagram API with Instagram Login" variant).
2. Your Instagram account must already be a **Professional** (Business or
   Creator) account, and must already be **linked to a Facebook Page**
   you administer, before this app can discover it. This app does not
   create that link — only Meta's own Instagram/Facebook apps do (Account
   Center → linked accounts, or Page Settings → Linked Accounts). Do this
   first if it isn't already the case.

### 4. Add Webhooks and configure the callback

1. Add the **Webhooks** product.
2. Set **Callback URL** to `https://YOUR-DOMAIN/api/webhooks/meta`
   (see Step 5/Deployment below — this must be a real, publicly reachable
   HTTPS URL; Meta will not deliver to `localhost`).
3. Set **Verify Token** to any string you choose. Put the same string in
   `.env` as `WEBHOOK_VERIFY_TOKEN`.
4. Click Verify/Save. Meta immediately sends a `GET` request to your
   callback URL with `hub.mode=subscribe&hub.verify_token=...&hub.challenge=...`.
   This app's `GET /api/webhooks/meta` (`app/api/webhooks/meta/route.ts`)
   echoes `hub.challenge` back only if the token matches — if this fails,
   the app isn't deployed/reachable yet, or the token doesn't match.
5. Subscribe to fields:
   - Under the **Instagram** object: `comments`
   - Under the **Page** object: `feed`

### 5. Request permissions

Under **App Review → Permissions and Features** (or wherever the current
UI surfaces permission requests), request:

| Permission | Why |
|---|---|
| `pages_show_list` | List the Pages the authorizing user manages |
| `pages_read_engagement` | Read Page comments |
| `pages_manage_engagement` | Reply to Page comments (private replies) |
| `pages_manage_metadata` | Subscribe the Page to webhook fields |
| `pages_messaging` | Send Facebook Page private replies (comment → DM) |
| `instagram_business_basic` | Read basic Instagram account/media info |
| `instagram_business_manage_comments` | Read Instagram comments |
| `instagram_business_manage_messages` | Send Instagram private replies (comment → DM) |
| `business_management` | Manage the Business assets a Page/IG account belongs to |

These exact names are requested together by `lib/meta/oauth.ts`
(`META_OAUTH_SCOPES`) — you don't need to configure the scope string
anywhere else.

**In App Development Mode** (default for a new app), any of these
permissions already work for accounts with a role on the app (you, as
Admin, plus anyone added under **App Roles → Roles**) — no review needed
yet. This is enough for Steps 6–13 below with your own account.
**App Review is only required to let other people's accounts connect** —
see the section below.

### 6. Fill in `.env`

```bash
META_APP_ID=<from Settings → Basic>
META_APP_SECRET=<from Settings → Basic, "Show">
META_GRAPH_API_VERSION=v25.0   # confirm at the changelog URL above first
META_REDIRECT_URI=https://YOUR-DOMAIN/api/auth/meta/callback
WEBHOOK_VERIFY_TOKEN=<any string you chose in Step 4.3>
MOCK_META=false
```

Values you generate yourself, not from Meta:

```bash
NEXTAUTH_SECRET=$(openssl rand -base64 32)
TOKEN_ENCRYPTION_KEY=$(openssl rand -base64 32)
MCP_AUTH_TOKEN=$(openssl rand -hex 32)
```

`DATABASE_URL` and `NEXTAUTH_URL` depend on your deployment (see below).

---

## App Review (only needed for other people's accounts)

In Development Mode, only accounts added under App Roles can use the
permissions above. To let **any** business connect their own
Instagram/Facebook accounts, every permission above except
`pages_show_list` requires **App Review**, which needs:

- A screencast of the exact comment → private-reply flow working.
- A privacy policy URL (and, for some permissions, a data-deletion
  callback URL).
- Possibly **Business Verification** of your Meta Business account,
  depending on permission and volume.

This is a real, multi-day-to-multi-week human process with Meta, not
something this codebase or I can complete on your behalf. Budget for
rejection-and-resubmission cycles.

---

## Production webhook delivery checklist

- [ ] Deployed with a real public HTTPS URL (see README §Deployment)
- [ ] `META_APP_SECRET` is from the **production** app, not a dev/test one
- [ ] `WEBHOOK_VERIFY_TOKEN` matches the App Dashboard's webhook config
- [ ] Webhook subscription shows verified/active after the `GET` handshake
- [ ] A real test comment on your own (Admin-role) account produces a
      `TriggerLog` with `status: SUCCESS`
- [ ] `TOKEN_ENCRYPTION_KEY` is a real generated key, not a placeholder
- [ ] `MOCK_META=false`

## Known Meta restrictions this app cannot work around

- **Private reply window**: a comment can only receive a private reply
  within a limited time after posting (documented as up to 7 days), and
  generally **only once per comment, ever**. A `FAILED` `TriggerLog` for
  an old or already-replied comment is Meta's policy working as intended,
  not a bug.
- **Rate limits**: Instagram messaging endpoints are limited to a low
  number of calls per second per professional account. `lib/meta/client.ts`
  classifies `RATE_LIMITED` distinctly but does not auto-retry — a
  rate-limited send is logged as `FAILED`, not silently retried.
- **Instagram Professional + linked Page requirement**: see "Which
  integration path this app uses" above.

Until every item in the checklist above is true against real Meta
credentials on a real deployment, comment-to-DM delivery is **unverified**
— this codebase is a correct implementation against Meta's documented API
surface, but "the code is right" and "Meta has actually delivered a DM to
a real Instagram user through it" are different claims, and only the
second one means this is done.
