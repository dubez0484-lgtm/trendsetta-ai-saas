import { notFound } from "next/navigation";

import { withUserContext } from "@/lib/corePrisma";
import { requireUser } from "@/lib/requireUser";

export default async function WorkspaceDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser();

  // RLS (workspaces_select_members OR workspaces_select_own_as_owner)
  // returns null here for both "doesn't exist" and "you're not a
  // member" -- deliberately indistinguishable to the caller.
  const workspace = await withUserContext(user.id, (tx) =>
    tx.workspace.findUnique({ where: { slug } })
  );

  if (!workspace) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-24">
      <div className="glass-panel flex max-w-md flex-col gap-2 p-8">
        <h1 className="text-2xl font-semibold text-neon-glow">{workspace.name}</h1>
        <p className="text-sm text-white/60">Workspace dashboard — more to come.</p>
      </div>
    </main>
  );
}
