import Link from "next/link";
import { redirect } from "next/navigation";

import { withUserContext } from "@/lib/corePrisma";
import { requireUser } from "@/lib/requireUser";

export default async function AppHomePage() {
  const user = await requireUser();

  const workspaces = await withUserContext(user.id, (tx) =>
    tx.workspace.findMany({ orderBy: { createdAt: "asc" } })
  );

  const onlyWorkspace = workspaces.length === 1 ? workspaces[0] : undefined;
  if (onlyWorkspace) {
    redirect(`/app/${onlyWorkspace.slug}`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-24">
      <div className="glass-panel flex w-full max-w-sm flex-col gap-4 p-8">
        <h1 className="text-xl font-semibold text-neon-glow">Your workspaces</h1>
        {workspaces.length === 0 ? (
          <p className="text-sm text-white/60">You don&apos;t have a workspace yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {workspaces.map((workspace) => (
              <li key={workspace.id}>
                <Link href={`/app/${workspace.slug}`} className="text-sm text-neon-blue hover:underline">
                  {workspace.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/app/new"
          className="rounded-lg bg-neon-blue px-4 py-2 text-center text-sm font-medium text-white transition hover:shadow-neon-glow"
        >
          Create workspace
        </Link>
      </div>
    </main>
  );
}
