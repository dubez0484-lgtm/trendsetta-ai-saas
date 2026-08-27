import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-24">
      <div className="glass-panel flex max-w-md flex-col gap-4 p-8 shadow-neon-glow">
        <h1 className="text-2xl font-semibold text-neon-glow">THETRENDSETTA</h1>
        <p className="text-sm text-white/70">
          Shared core platform: auth, billing, and brand system for THETRENDSETTA products.
        </p>
        <p className="text-sm text-white/50">
          {session?.user ? `Signed in as ${session.user.email}` : "Not signed in."}
        </p>
      </div>
    </main>
  );
}
