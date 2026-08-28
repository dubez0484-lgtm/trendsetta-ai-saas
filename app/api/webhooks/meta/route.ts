/**
 * Meta webhook endpoint: GET handles Meta's subscription verification
 * handshake, POST receives comment events and drives them through the
 * automation engine. Every POST delivery is signature-checked and
 * deduplicated via the WebhookEvent table before any side effect runs.
 */
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { verifyMetaWebhookSignature } from '@/lib/security/webhook-signature';
import { logger } from '@/lib/security/logger';
import { parseMetaWebhookPayload } from '@/lib/meta/webhook-parser';
import { executeAutomationForComment } from '@/lib/automation/engine';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const verifyToken = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken = process.env.WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && expectedToken && verifyToken === expectedToken && challenge) {
    logger.info('meta_webhook_verified');
    return new NextResponse(challenge, { status: 200 });
  }

  logger.warn('meta_webhook_verification_failed', { mode });
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret) {
    logger.error('meta_webhook_missing_app_secret');
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Server misconfiguration.' } }, { status: 500 });
  }

  if (!verifyMetaWebhookSignature(rawBody, signature, appSecret)) {
    logger.warn('meta_webhook_invalid_signature');
    return NextResponse.json({ success: false, error: { code: 'INVALID_SIGNATURE', message: 'Signature validation failed.' } }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    logger.warn('meta_webhook_malformed_payload');
    return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Malformed JSON payload.' } }, { status: 400 });
  }

  const changes = parseMetaWebhookPayload(payload);

  for (const change of changes) {
    let webhookEvent;
    try {
      webhookEvent = await prisma.webhookEvent.create({
        data: {
          eventId: change.eventId,
          eventType: change.eventType,
          payload: payload as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        logger.info('meta_webhook_duplicate_event', { eventId: change.eventId });
        continue; // Already seen this delivery — Meta retried. Skip silently.
      }
      throw error;
    }

    if (!change.event) {
      // Recognized field we don't act on (e.g. non-"add" verb comment
      // edits/deletes). Mark processed so it's not retried indefinitely.
      await prisma.webhookEvent.update({ where: { id: webhookEvent.id }, data: { processed: true } });
      continue;
    }

    try {
      const result = await executeAutomationForComment(change.event);
      logger.info('meta_webhook_event_processed', {
        eventId: change.eventId,
        status: result.status,
        automationId: result.automationId,
      });
    } catch (error) {
      logger.error('meta_webhook_event_processing_failed', {
        eventId: change.eventId,
        message: error instanceof Error ? error.message : String(error),
      });
      // Don't rethrow: we've already recorded the WebhookEvent, so a retry
      // from Meta would just hit the duplicate-event branch above. The
      // failure is visible in server logs / TriggerLog for investigation.
    }

    await prisma.webhookEvent.update({ where: { id: webhookEvent.id }, data: { processed: true } });
  }

  // Always 200 once signature-verified and parsed: Meta retries on
  // non-2xx, and retries can't fix per-event processing errors that are
  // already durably recorded.
  return NextResponse.json({ success: true });
}
