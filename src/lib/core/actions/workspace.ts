"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { withUserContext } from "@/lib/corePrisma";
import { requireUser } from "@/lib/requireUser";
import { createWorkspaceSchema } from "@/lib/validators/workspace";

export type CreateWorkspaceState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

/**
 * Creates a workspace and its founding OWNER membership in one
 * transaction via withUserContext -- both inserts share the same
 * app.current_user_id context, satisfying the workspace bootstrap RLS
 * policies (workspaces_insert_self_owned +
 * memberships_insert_bootstrap_owner).
 */
export async function createWorkspace(
  _prevState: CreateWorkspaceState,
  formData: FormData
): Promise<CreateWorkspaceState> {
  const user = await requireUser();

  const parsed = createWorkspaceSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, slug } = parsed.data;

  try {
    await withUserContext(user.id, async (tx) => {
      const workspace = await tx.workspace.create({
        data: { name, slug, ownerId: user.id },
      });

      await tx.workspaceMembership.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          role: "OWNER",
          status: "ACTIVE",
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { fieldErrors: { slug: ["That slug is already taken."] } };
    }
    return { error: "Something went wrong creating the workspace. Please try again." };
  }

  revalidatePath("/app");
  redirect(`/app/${slug}`);
}
