/**
 * Validates Meta's `X-Hub-Signature-256` header on incoming webhook
 * deliveries. Meta signs the raw request body with HMAC-SHA256 using the
 * app secret; requests without a valid signature must be rejected before
 * any payload data is trusted.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks/getting-started#validating-payloads
 */
import { createHmac, timingSafeEqual } from 'crypto';

const SIGNATURE_PREFIX = 'sha256=';

/**
 * @param rawBody   The exact, unparsed request body bytes/string Meta sent.
 *                  Signature validation fails silently if the body has been
 *                  re-serialized, so always validate against the raw text.
 * @param signatureHeader  The `X-Hub-Signature-256` header value.
 * @param appSecret        META_APP_SECRET.
 */
export function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith(SIGNATURE_PREFIX)) {
    return false;
  }

  const providedSignature = signatureHeader.slice(SIGNATURE_PREFIX.length);
  const expectedSignature = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');

  const provided = Buffer.from(providedSignature, 'hex');
  const expected = Buffer.from(expectedSignature, 'hex');

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}
