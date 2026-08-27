"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createWorkspace, type CreateWorkspaceState } from "@/lib/core/actions/workspace";

const initialState: CreateWorkspaceState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-neon-blue px-4 py-2 text-sm font-medium text-white transition hover:shadow-neon-glow disabled:opacity-50"
    >
      {pending ? "Creating…" : "Create workspace"}
    </button>
  );
}

export function CreateWorkspaceForm() {
  const [state, formAction] = useActionState(createWorkspace, initialState);

  return (
    <form action={formAction} className="glass-panel flex w-full max-w-sm flex-col gap-4 p-8">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm text-white/70">
          Workspace name
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="Acme Inc."
          className="rounded-lg border border-matte-border bg-matte-black px-4 py-2 text-sm outline-none focus:border-neon-blue"
        />
        {state.fieldErrors?.name ? (
          <p className="text-sm text-red-400">{state.fieldErrors.name[0]}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="slug" className="text-sm text-white/70">
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          required
          placeholder="acme-inc"
          className="rounded-lg border border-matte-border bg-matte-black px-4 py-2 text-sm outline-none focus:border-neon-blue"
        />
        {state.fieldErrors?.slug ? (
          <p className="text-sm text-red-400">{state.fieldErrors.slug[0]}</p>
        ) : null}
      </div>

      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}

      <SubmitButton />
    </form>
  );
}
