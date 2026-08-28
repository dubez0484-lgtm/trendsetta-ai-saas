import { createHmac, randomUUID } from 'crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { Platform } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { GET, POST } from '@/app/api/webhooks/meta/route';
import { createTestAutomation, createTestSocialAccount, createTestUser, resetDatabase } from '../helpers/db';

const APP_SECRET = process.env.META_APP_SECRET!;
const WEBHOOK_URL = 'http://localhost/api/webhooks/meta';

function sign(body: string) {
  return 'sha256=' + createHmac('sha256', APP_SECRET).update(body, 'utf8').digest('hex');
}

function instagramCommentPayload(accountId: string, commentId: string, text: string) {
  return {
    object: 'instagram',
    entry: [
      {
        id: accountId,
        changes: [
          { field: 'comments', value: { id: commentId, text, from: { id: `commenter_${commentId}` } } },
        ],
      },
    ],
  };
}

function postWebhook(payload: unknown, signatureOverride?: string | null) {
  const rawBody = JSON.stringify(payload);
  const headers = new Headers({ 'content-type': 'application/json' });
  const signature = signatureOverride === undefined ? sign(rawBody) : signatureOverride;
  if (signature !== null) headers.set('x-hub-signature-256', signature);

  const request = new NextRequest(WEBHOOK_URL, { method: 'POST', headers, body: rawBody });
  return POST(request);
}

beforeEach(async () => {
  await resetDatabase();
});

describe('GET /api/webhooks/meta (verification handshake)', () => {
  it('echoes hub.challenge when the verify token matches', async () => {
    const url = `${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=${process.env.WEBHOOK_VERIFY_TOKEN}&hub.challenge=12345`;
    const response = await GET(new NextRequest(url));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('12345');
  });

  it('rejects an invalid verify token', async () => {
    const url = `${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=12345`;
    const response = await GET(new NextRequest(url));
    expect(response.status).toBe(403);
  });
});

describe('POST /api/webhooks/meta (signature validation)', () => {
  it('rejects a request with a valid signature computed over a different body', async () => {
    const payload = instagramCommentPayload('ig_1', 'c1', 'hello');
    const wrongSignature = sign(JSON.stringify({ different: true }));
    const response = await postWebhook(payload, wrongSignature);
    expect(response.status).toBe(401);
  });

  it('rejects a request with no signature header', async () => {
    const payload = instagramCommentPayload('ig_1', 'c1', 'hello');
    const response = await postWebhook(payload, null);
    expect(response.status).toBe(401);
  });

  it('accepts a correctly signed request', async () => {
    const payload = instagramCommentPayload('ig_unknown', 'c1', 'hello');
    const response = await postWebhook(payload);
    expect(response.status).toBe(200);
  });
});

describe('POST /api/webhooks/meta (malformed payload)', () => {
  it('returns 400 for invalid JSON', async () => {
    const rawBody = '{not valid json';
    const headers = new Headers({ 'x-hub-signature-256': sign(rawBody) });
    const request = new NextRequest(WEBHOOK_URL, { method: 'POST', headers, body: rawBody });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

describe('POST /api/webhooks/meta (end-to-end processing + idempotency)', () => {
  it('matches an automation, sends a mock DM, and records a TriggerLog', async () => {
    const user = await createTestUser();
    const account = await createTestSocialAccount(user.id, { platform: Platform.INSTAGRAM, accountId: 'ig_webhook_1' });
    await createTestAutomation(user.id, account.id, { keyword: 'link' });

    const commentId = `c_${randomUUID()}`;
    const payload = instagramCommentPayload('ig_webhook_1', commentId, 'send me the link');
    const response = await postWebhook(payload);

    expect(response.status).toBe(200);

    const log = await prisma.triggerLog.findFirst({ where: { commentId } });
    expect(log?.status).toBe('SUCCESS');
  });

  it('does not process the same webhook delivery twice', async () => {
    const user = await createTestUser();
    const account = await createTestSocialAccount(user.id, { platform: Platform.INSTAGRAM, accountId: 'ig_webhook_2' });
    await createTestAutomation(user.id, account.id, { keyword: 'link' });

    const commentId = `c_${randomUUID()}`;
    const payload = instagramCommentPayload('ig_webhook_2', commentId, 'send me the link');

    await postWebhook(payload);
    await postWebhook(payload); // Meta retry of the exact same delivery.

    const logs = await prisma.triggerLog.findMany({ where: { commentId } });
    expect(logs).toHaveLength(1);

    const events = await prisma.webhookEvent.findMany();
    expect(events).toHaveLength(1);
  });
});
