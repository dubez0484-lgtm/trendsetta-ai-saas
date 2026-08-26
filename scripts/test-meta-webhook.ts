#!/usr/bin/env node
/**
 * Sends a realistic, correctly-signed Instagram or Facebook comment
 * webhook event to a running local server's /api/webhooks/meta endpoint,
 * so the full webhook → matcher → engine → DM (mock) → TriggerLog path
 * can be exercised without Meta App Review or real credentials.
 *
 * Usage:
 *   npm run dev                                  # in one terminal
 *   npm run mock:webhook -- --platform=instagram --comment="I want the link"
 *   npm run mock:webhook -- --platform=facebook  --comment="send me the link"
 *
 * Requires MOCK_META=true (see .env) so no real DM is attempted, and
 * requires an active automation + connected SocialAccount matching the
 * accountId/platform used below — see README.md "Mock Meta mode".
 */
import 'dotenv/config';
import { createHmac, randomUUID } from 'crypto';

interface CliArgs {
  platform: 'instagram' | 'facebook';
  comment: string;
  accountId: string;
  baseUrl: string;
}

function parseArgs(): CliArgs {
  const args = new Map<string, string>();
  for (const arg of process.argv.slice(2)) {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    if (key) args.set(key, rest.join('='));
  }

  return {
    platform: (args.get('platform') as 'instagram' | 'facebook') || 'instagram',
    comment: args.get('comment') || 'I want the link please!',
    accountId: args.get('accountId') || 'MOCK_ACCOUNT_ID',
    baseUrl: args.get('baseUrl') || 'http://localhost:3000',
  };
}

function buildInstagramPayload(accountId: string, comment: string) {
  return {
    object: 'instagram',
    entry: [
      {
        id: accountId,
        time: Math.floor(Date.now() / 1000),
        changes: [
          {
            field: 'comments',
            value: {
              id: `mock_comment_${randomUUID()}`,
              text: comment,
              from: { id: `mock_commenter_${randomUUID()}`, username: 'test_commenter' },
              media: { id: `mock_post_${randomUUID()}` },
            },
          },
        ],
      },
    ],
  };
}

function buildFacebookPayload(accountId: string, comment: string) {
  return {
    object: 'page',
    entry: [
      {
        id: accountId,
        time: Math.floor(Date.now() / 1000),
        changes: [
          {
            field: 'feed',
            value: {
              item: 'comment',
              verb: 'add',
              comment_id: `mock_comment_${randomUUID()}`,
              post_id: `mock_post_${randomUUID()}`,
              message: comment,
              from: { id: `mock_commenter_${randomUUID()}`, name: 'Test Commenter' },
            },
          },
        ],
      },
    ],
  };
}

async function main() {
  const args = parseArgs();
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret) {
    console.error('META_APP_SECRET is not set. Set it in .env (any placeholder value works with MOCK_META=true).');
    process.exit(1);
  }

  const payload = args.platform === 'instagram' ? buildInstagramPayload(args.accountId, args.comment) : buildFacebookPayload(args.accountId, args.comment);
  const rawBody = JSON.stringify(payload);
  const signature = 'sha256=' + createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');

  console.log(`Sending mock ${args.platform} comment webhook to ${args.baseUrl}/api/webhooks/meta`);
  console.log(`Comment text: "${args.comment}"`);

  const response = await fetch(`${args.baseUrl}/api/webhooks/meta`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Hub-Signature-256': signature,
    },
    body: rawBody,
  });

  const body = await response.text();
  console.log(`Response: ${response.status}`);
  console.log(body);

  if (!response.ok) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
