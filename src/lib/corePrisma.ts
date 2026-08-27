import { Prisma, PrismaClient } from "@prisma/client";

// Restricted runtime connection for the shared-platform "Core" tables
// (workspaces, workspace_memberships, products, workspace_products,
// subscriptions). Authenticates as the "app_runtime" Postgres role,
// which cannot bypass Row Level Security and has no grants at all on
// the original 9 application tables (users/accounts/sessions/etc) --
// those stay on the admin client in `src/lib/prisma.ts`.
//
// Do NOT import `@/lib/prisma` (the admin/postgres client) to read or
// write the five Core tables above -- it authenticates as "postgres",
// which bypasses RLS entirely and would silently ignore workspace
// isolation with no error.
//
// This module deliberately does not export the raw client instance.
// The only sanctioned way to query Core tables is `withUserContext`,
// which guarantees `app.current_user_id` is set on the same
// transaction/connection before any query runs against it.

const APP_RUNTIME_DATABASE_URL = process.env.APP_RUNTIME_DATABASE_URL;

if (!APP_RUNTIME_DATABASE_URL) {
  throw new Error(
    "APP_RUNTIME_DATABASE_URL is not set. Core-table access must never fall back " +
      "to DATABASE_URL (the admin/postgres connection, which bypasses RLS)."
  );
}

const globalForCorePrisma = globalThis as unknown as { corePrisma?: PrismaClient };

const corePrisma =
  globalForCorePrisma.corePrisma ?? new PrismaClient({ datasourceUrl: APP_RUNTIME_DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  globalForCorePrisma.corePrisma = corePrisma;
}

/**
 * Runs `callback` inside a single Postgres transaction with
 * `app.current_user_id` set as a transaction-local session variable
 * (`set_config(..., true)`), so every RLS policy on the Core tables
 * (all keyed on that setting) evaluates against the authenticated
 * user's real workspace memberships.
 *
 * Transaction-local, not session-local: the setting is guaranteed
 * cleared at COMMIT/ROLLBACK, before the connection returns to
 * Supabase's transaction-mode pooler. Never use plain `SET` or
 * `set_config(..., false)` here -- either would leak this value to a
 * later, unrelated request sharing the same pooled physical
 * connection.
 *
 * `tx` is the only Core-table query surface handed to callers -- there
 * is no way to query these tables without going through this context.
 */
export async function withUserContext<T>(
  userId: string,
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return corePrisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
    return callback(tx);
  });
}
