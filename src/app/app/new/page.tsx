import { CreateWorkspaceForm } from "@/components/workspaces/CreateWorkspaceForm";
import { requireUser } from "@/lib/requireUser";

export default async function NewWorkspacePage() {
  await requireUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-24">
      <div className="flex max-w-sm flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold text-neon-glow">Create a workspace</h1>
        <p className="text-sm text-white/60">
          This becomes the shared home for your team, products, and billing.
        </p>
      </div>
      <CreateWorkspaceForm />
    </main>
  );
}
