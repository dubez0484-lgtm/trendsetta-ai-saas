/**
 * Sends automated private replies (comment → DM) via the Meta Graph API.
 * Both Instagram and Facebook use the same `/{comment-id}/private_replies`
 * edge; the token/permissions requirements differ per platform (see
 * docs/META_SETUP.md). All Meta send calls must go through this module.
 */
import { graphRequest, isMockMetaMode } from '@/lib/meta/client';
import { logger } from '@/lib/security/logger';

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface PrivateReplyResponse {
  id?: string;
  message_id?: string;
}

async function sendPrivateReply(commentId: string, accessToken: string, message: string): Promise<SendMessageResult> {
  const result = await graphRequest<PrivateReplyResponse>(`/${commentId}/private_replies`, {
    method: 'POST',
    accessToken,
    body: { message },
  });

  if (!result.success) {
    return { success: false, error: `${result.error.code}: ${result.error.message}` };
  }

  return { success: true, messageId: result.data.id || result.data.message_id };
}

/**
 * Sends a private reply DM in response to an Instagram comment.
 * Requires `instagram_business_manage_messages` and a comment from within the last
 * 7 days (Meta policy) that has not already received a private reply.
 */
export async function sendInstagramPrivateReply(
  commentId: string,
  accessToken: string,
  message: string,
): Promise<SendMessageResult> {
  if (isMockMetaMode()) {
    logger.info('mock_meta_instagram_private_reply', { commentId });
    return { success: true, messageId: `mock_ig_${commentId}` };
  }

  return sendPrivateReply(commentId, accessToken, message);
}

/**
 * Sends a private reply DM in response to a Facebook Page comment.
 * Requires `pages_messaging` and `pages_manage_engagement`.
 */
export async function sendFacebookPrivateReply(
  commentId: string,
  accessToken: string,
  message: string,
): Promise<SendMessageResult> {
  if (isMockMetaMode()) {
    logger.info('mock_meta_facebook_private_reply', { commentId });
    return { success: true, messageId: `mock_fb_${commentId}` };
  }

  return sendPrivateReply(commentId, accessToken, message);
}
