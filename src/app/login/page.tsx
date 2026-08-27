"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    window.location.href = "/";
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="glass-panel flex w-full max-w-sm flex-col gap-4 p-8">
        <h1 className="text-xl font-semibold text-neon-glow">Sign in</h1>
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-matte-border bg-matte-black px-4 py-2 text-sm outline-none focus:border-neon-blue"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-matte-border bg-matte-black px-4 py-2 text-sm outline-none focus:border-neon-blue"
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          className="rounded-lg bg-neon-blue px-4 py-2 text-sm font-medium text-white transition hover:shadow-neon-glow"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
