import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

/**
 * Reads the NextAuth session and redirects to /login if unauthenticated.
 * Use at the top of any Server Component, Server Action, or Route
 * Handler that needs the authenticated user's id.
 */
export async function requireUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user;
}
