# Meta Developer Setup

This app talks to Instagram and Facebook through the **Meta Graph API**.
None of that works out of the box — Meta gates comment/messaging access
behind app configuration and, for production use with accounts you don't
own, **App Review**. This document is the exact path from zero to a
working webhook + DM send.

Nothing here is optional scaffolding: until you complete it, the app runs
correctly only in [mock mode](../README.md#mock-meta-mode)
(`MOCK_META=true`), which simulates Meta responses so you can build and
test the rest of the product without Meta credentials.

> **API version note:** this project defaults `META_GRAPH_API_VERSION` to
> `v21.0`, but do not assume that's current by the time you read this.
> Meta retires Graph API versions on a schedule — check
> https://developers.facebook.com/docs/graph-api/changelog before
> deploying, and set `META_GRAPH_API_VERSION` accordingly. The app reads
> this value from the environment everywhere (`lib/meta/client.ts`); it is
> never hard-coded.

## 1. Create a Meta Developer App

1. Go to https://developers.facebook.com/apps and create a new app.
2. Choose the **Business** app type.
3. Note the **App ID** and **App Secret** (Settings → Basic) — these become
   `META_APP_ID` and `META_APP_SECRET`.

## 2. Add Facebook Login

1. In the App Dashboard, add the **Facebook Login** product.
2. Under Facebook Login → Settings, add your OAuth redirect URI to
   **Valid OAuth Redirect URIs**:
   ```
   https://your-domain.com/api/auth/meta/callback
   ```
   For local development: `http://localhost:3000/api/auth/meta/callback`.
3. Set `META_REDIRECT_URI` to the exact same value.

## 3. Add the Instagram and Facebook products

1. Add the **Instagram Graph API** / **Instagram** product (naming has
   changed across Meta's dashboard versions — look for "Instagram" under
   Add Product).
2. Add the **Webhooks** product.
3. A Facebook Page must be linked to an Instagram **Professional**
   (Business or Creator) account for Instagram comment automation to
   work — this app does not create that link, it only discovers it
   (`lib/meta/oauth.ts: discoverPagesAndInstagramAccounts`).

## 4. Configure the webhook callback

Under Webhooks:

1. **Callback URL**: `https://your-domain.com/api/webhooks/meta`
2. **Verify Token**: any string you choose — set the same value as
   `WEBHOOK_VERIFY_TOKEN`. Meta calls `GET` on your callback URL with
   `hub.mode=subscribe&hub.verify_token=...&hub.challenge=...`; this app
   echoes `hub.challenge` back only if the token matches
   (`app/api/webhooks/meta/route.ts`).
3. Subscribe to these fields:
   - **Instagram** object: `comments`
   - **Page** object: `feed` (comments are delivered as `item: "comment"`
     changes within `feed`)
4. Every subsequent `POST` delivery is signed with your App Secret via the
   `X-Hub-Signature-256` header. This app validates that signature on
   every request (`lib/security/webhook-signature.ts`) and rejects
   anything that doesn't match — Meta retries on non-2xx responses, so an
   invalid signature is the one case this app intentionally does **not**
   swallow into a 200.

## 5. Required permissions

| Permission | Why |
|---|---|
| `pages_show_list` | List the Pages the authorizing user manages |
| `pages_read_engagement` | Read Page comments |
| `pages_manage_engagement` | Reply to Page comments (private replies) |
| `pages_manage_metadata` | Subscribe the Page to webhook fields |
| `pages_messaging` | Send Facebook Page private replies (comment → DM) |
| `instagram_basic` | Read basic Instagram account/media info |
| `instagram_manage_comments` | Read Instagram comments |
| `instagram_manage_messages` | Send Instagram private replies (comment → DM) |
| `business_management` | Manage the Business assets a Page/IG account belongs to |

These are requested together in `lib/meta/oauth.ts` (`META_OAUTH_SCOPES`).

## 6. App Review

In development mode, an app can only act on accounts with a role on the
app (Admin/Developer/Tester added under App Roles) — fine for building
and testing with your own Page/Instagram account. To let **other**
businesses connect their accounts, Meta requires **App Review** for every
permission above except `pages_show_list`. Review requires:

- A screencast demonstrating the exact comment → private-reply flow.
- A privacy policy URL and (for some permissions) a data deletion
  callback URL.
- For Instagram/Facebook messaging permissions specifically, your app
  may also need **Advanced Access** and, depending on your business
  model, Meta's **Business Verification**.

Budget real calendar time for this — it is not a same-day process, and
review can be rejected and require resubmission.

## 7. Test with your own account first

1. Add your Facebook account under App Roles (Admins can test without
   review).
2. Sign in to this app, go to `/dashboard/accounts`, click **Connect
   Instagram** or **Connect Facebook** — this walks the OAuth flow in
   `app/api/auth/meta/route.ts` → `app/api/auth/meta/callback/route.ts`.
3. Create an automation at `/dashboard/automations/new`.
4. Comment on your own connected Page post or Instagram post with the
   configured keyword and confirm a private reply DM arrives.
5. Check `/dashboard/logs` for the resulting `TriggerLog` row.

## 8. Production webhook delivery checklist

- [ ] `META_APP_SECRET` set from the **production** app (not a dev/test app)
- [ ] `WEBHOOK_VERIFY_TOKEN` matches what's configured in the App Dashboard
- [ ] Callback URL is publicly reachable over HTTPS (Meta requires TLS)
- [ ] Webhook subscription shows a green "Active" status after the
      verification `GET` handshake succeeds
- [ ] A real test comment on a **reviewed, non-developer** account
      produces a `TriggerLog` with `status: SUCCESS`
- [ ] `TOKEN_ENCRYPTION_KEY` is a real, securely generated 32-byte key —
      not the placeholder from `.env.example`
- [ ] `MOCK_META=false`

## Known Meta restrictions this app does not (and cannot) work around

- **7-day private reply window**: Meta only allows a private reply to a
  comment within a limited time window after the comment is posted
  (historically ~7 days) and generally only once per comment. This app
  does not retry past that window — a `FAILED` `TriggerLog` with a Meta
  permission/expiry error is expected in that case, not a bug.
- **Rate limits**: Graph API calls are rate-limited per app/per user.
  `lib/meta/client.ts` classifies `RATE_LIMITED` errors distinctly so the
  UI/logs can show *why* a send failed, but it does not implement
  automatic backoff/retry — a failed send is logged, not silently
  retried.
- **Instagram Business/Creator requirement**: automation only works for
  Instagram **Professional** accounts linked to a Facebook Page. A
  personal Instagram account cannot be connected.

Until every item in the Section 8 checklist is true against real Meta
credentials, treat comment-to-DM delivery as **unverified** — this
codebase implements the real integration, but "the code is correct" and
"Meta has approved and is actually delivering to real users" are
different claims.
