import { describe, expect, it } from 'vitest';
import { parseMetaWebhookPayload } from '@/lib/meta/webhook-parser';

describe('parseMetaWebhookPayload — Instagram', () => {
  it('normalizes an Instagram comment change', () => {
    const payload = {
      object: 'instagram',
      entry: [
        {
          id: 'ig_account_1',
          changes: [
            {
              field: 'comments',
              value: {
                id: 'comment_1',
                text: 'I want the link',
                from: { id: 'commenter_1', username: 'jane' },
                media: { id: 'post_1' },
              },
            },
          ],
        },
      ],
    };

    const [change] = parseMetaWebhookPayload(payload);
    expect(change).toBeDefined();
    expect(change!.event).toEqual({
      platform: 'INSTAGRAM',
      accountId: 'ig_account_1',
      commentId: 'comment_1',
      commentText: 'I want the link',
      commenterId: 'commenter_1',
      commenterUsername: 'jane',
      postId: 'post_1',
      postUrl: undefined,
    });
  });
});

describe('parseMetaWebhookPayload — Facebook', () => {
  it('normalizes a Facebook Page feed comment change', () => {
    const payload = {
      object: 'page',
      entry: [
        {
          id: 'page_1',
          changes: [
            {
              field: 'feed',
              value: {
                item: 'comment',
                verb: 'add',
                comment_id: 'comment_2',
                post_id: 'post_2',
                message: 'send me the link',
                from: { id: 'commenter_2', name: 'John' },
              },
            },
          ],
        },
      ],
    };

    const [change] = parseMetaWebhookPayload(payload);
    expect(change!.event?.platform).toBe('FACEBOOK');
    expect(change!.event?.commentId).toBe('comment_2');
    expect(change!.event?.commentText).toBe('send me the link');
  });

  it('ignores non-comment feed changes (e.g. reactions)', () => {
    const payload = {
      object: 'page',
      entry: [{ id: 'page_1', changes: [{ field: 'feed', value: { item: 'reaction', verb: 'add' } }] }],
    };

    expect(parseMetaWebhookPayload(payload)).toEqual([]);
  });

  it('ignores comment edits/deletes (non-"add" verb)', () => {
    const payload = {
      object: 'page',
      entry: [
        { id: 'page_1', changes: [{ field: 'feed', value: { item: 'comment', verb: 'edited', comment_id: 'c1' } }] },
      ],
    };

    expect(parseMetaWebhookPayload(payload)).toEqual([]);
  });
});

describe('parseMetaWebhookPayload — malformed payloads', () => {
  it('returns an empty array for a payload with no entry array', () => {
    expect(parseMetaWebhookPayload({ object: 'page' })).toEqual([]);
  });

  it('returns an empty array for null/undefined input', () => {
    expect(parseMetaWebhookPayload(null)).toEqual([]);
    expect(parseMetaWebhookPayload(undefined)).toEqual([]);
  });

  it('skips entries missing an id', () => {
    const payload = { object: 'page', entry: [{ changes: [{ field: 'feed', value: {} }] }] };
    expect(parseMetaWebhookPayload(payload)).toEqual([]);
  });

  it('produces stable, distinct eventIds for distinct comments', () => {
    const makePayload = (commentId: string) => ({
      object: 'instagram',
      entry: [
        {
          id: 'ig_account_1',
          changes: [{ field: 'comments', value: { id: commentId, text: 'hi', from: { id: 'u1' } } }],
        },
      ],
    });

    const [a] = parseMetaWebhookPayload(makePayload('comment_a'));
    const [b] = parseMetaWebhookPayload(makePayload('comment_b'));
    const [aAgain] = parseMetaWebhookPayload(makePayload('comment_a'));

    expect(a!.eventId).not.toBe(b!.eventId);
    expect(a!.eventId).toBe(aAgain!.eventId);
  });
});
