import { z } from "zod";

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(60, "Name must be 60 characters or fewer."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Slug must be at least 3 characters.")
    .max(48, "Slug must be 48 characters or fewer.")
    .regex(slugPattern, "Use lowercase letters, numbers, and single hyphens only."),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
