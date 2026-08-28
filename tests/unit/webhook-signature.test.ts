import { createHmac } from 'crypto';
import { describe, expect, it } from 'vitest';
import { verifyMetaWebhookSignature } from '@/lib/security/webhook-signature';

const APP_SECRET = 'test-app-secret';

function sign(body: string, secret = APP_SECRET) {
  return 'sha256=' + createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}

describe('verifyMetaWebhookSignature', () => {
  it('accepts a validly signed payload', () => {
    const body = JSON.stringify({ hello: 'world' });
    expect(verifyMetaWebhookSignature(body, sign(body), APP_SECRET)).toBe(true);
  });

  it('rejects a payload signed with the wrong secret', () => {
    const body = JSON.stringify({ hello: 'world' });
    expect(verifyMetaWebhookSignature(body, sign(body, 'wrong-secret'), APP_SECRET)).toBe(false);
  });

  it('rejects a tampered body', () => {
    const body = JSON.stringify({ hello: 'world' });
    const signature = sign(body);
    const tamperedBody = JSON.stringify({ hello: 'mallory' });
    expect(verifyMetaWebhookSignature(tamperedBody, signature, APP_SECRET)).toBe(false);
  });

  it('rejects a missing signature header', () => {
    expect(verifyMetaWebhookSignature('{}', null, APP_SECRET)).toBe(false);
  });

  it('rejects a malformed signature header', () => {
    expect(verifyMetaWebhookSignature('{}', 'not-a-real-signature', APP_SECRET)).toBe(false);
  });
});
