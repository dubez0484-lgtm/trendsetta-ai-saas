/**
 * Zod schemas for automation input, shared by the REST API routes and the
 * MCP server so validation never drifts between the two entry points.
 */
import { z } from 'zod';

export const platformSchema = z.enum(['INSTAGRAM', 'FACEBOOK']);
export const matchTypeSchema = z.enum(['CONTAINS', 'EXACT', 'REGEX']);

export const createAutomationSchema = z.object({
  socialAccountId: z.string().min(1),
  keyword: z.string().min(1).max(500),
  matchType: matchTypeSchema.default('CONTAINS'),
  replyMessage: z.string().min(1).max(1000),
  linkUrl: z.string().url().optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  isActive: z.boolean().default(true),
});

export const updateAutomationSchema = z.object({
  keyword: z.string().min(1).max(500).optional(),
  matchType: matchTypeSchema.optional(),
  replyMessage: z.string().min(1).max(1000).optional(),
  linkUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v))
    .optional(),
  isActive: z.boolean().optional(),
});

export const mcpCreateAutomationSchema = z.object({
  keyword: z.string().min(1).max(500),
  replyMessage: z.string().min(1).max(1000),
  linkUrl: z.string().url().optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  platform: platformSchema,
  matchType: matchTypeSchema.default('CONTAINS'),
});
