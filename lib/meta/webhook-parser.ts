/**
 * Normalizes raw Meta webhook payloads (Instagram comments, Facebook Page
 * feed comments) into the platform-agnostic shape the automation engine
 * consumes, and derives a stable idempotency key per change.
 *
 * Meta's payload shapes:
 *  - Instagram: { object: "instagram", entry: [{ id, changes: [{ field: "comments", value: {...} }] }] }
 *  - Facebook:  { object: "page", entry: [{ id, changes: [{ field: "feed", value: { item: "comment", ... } }] }] }
 */
import { createHash } from 'crypto';
import { Platform } from '@prisma/client';
import type { NormalizedCommentEvent } from '@/lib/automation/engine';

export interface ParsedWebhookChange {
  eventId: string;
  eventType: string;
  event: NormalizedCommentEvent | null;
}

interface MetaWebhookPayload {
  object?: string;
  entry?: MetaWebhookEntry[];
}

interface MetaWebhookEntry {
  id?: string;
  time?: number;
  changes?: MetaWebhookChange[];
}

interface MetaWebhookChange {
  field?: string;
  value?: Record<string, unknown>;
}

function deriveEventId(object: string, entryId: string, field: string, discriminator: string): string {
  return createHash('sha256').update(`${object}:${entryId}:${field}:${discriminator}`).digest('hex');
}

function parseInstagramCommentChange(entryId: string, value: Record<string, unknown>): ParsedWebhookChange | null {
  const commentId = typeof value.id === 'string' ? value.id : undefined;
  if (!commentId) return null;

  const from = value.from as { id?: string; username?: string } | undefined;
  const media = value.media as { id?: string } | undefined;

  return {
    eventId: deriveEventId('instagram', entryId, 'comments', commentId),
    eventType: 'instagram.comments',
    event: {
      platform: Platform.INSTAGRAM,
      accountId: entryId,
      commentId,
      commentText: typeof value.text === 'string' ? value.text : '',
      commenterId: from?.id || 'unknown',
      commenterUsername: from?.username,
      postId: media?.id,
      postUrl: undefined,
    },
  };
}

function parseFacebookFeedChange(entryId: string, value: Record<string, unknown>): ParsedWebhookChange | null {
  if (value.item !== 'comment' || value.verb !== 'add') {
    return null;
  }

  const commentId = typeof value.comment_id === 'string' ? value.comment_id : undefined;
  if (!commentId) return null;

  const from = value.from as { id?: string; name?: string } | undefined;

  return {
    eventId: deriveEventId('page', entryId, 'feed', commentId),
    eventType: 'page.feed.comment',
    event: {
      platform: Platform.FACEBOOK,
      accountId: entryId,
      commentId,
      commentText: typeof value.message === 'string' ? value.message : '',
      commenterId: from?.id || (typeof value.sender_id === 'string' ? value.sender_id : 'unknown'),
      commenterUsername: from?.name,
      postId: typeof value.post_id === 'string' ? value.post_id : undefined,
      postUrl: undefined,
    },
  };
}

/**
 * Parses a raw Meta webhook payload into zero or more normalized changes.
 * Unrecognized fields/objects are safely skipped (not thrown) since Meta
 * apps can be subscribed to fields this engine doesn't act on.
 */
export function parseMetaWebhookPayload(payload: unknown): ParsedWebhookChange[] {
  const body = payload as MetaWebhookPayload;
  if (!body || typeof body !== 'object' || !Array.isArray(body.entry)) {
    return [];
  }

  const object = body.object || 'unknown';
  const results: ParsedWebhookChange[] = [];

  for (const entry of body.entry) {
    const entryId = entry.id;
    if (!entryId || !Array.isArray(entry.changes)) continue;

    for (const change of entry.changes) {
      if (!change.field || !change.value) continue;

      let parsed: ParsedWebhookChange | null = null;
      if (object === 'instagram' && change.field === 'comments') {
        parsed = parseInstagramCommentChange(entryId, change.value);
      } else if (object === 'page' && change.field === 'feed') {
        parsed = parseFacebookFeedChange(entryId, change.value);
      }

      if (parsed) results.push(parsed);
    }
  }

  return results;
}
