import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**"],
  },
  {
    // Code that queries the shared-platform Core tables (workspaces,
    // workspace_memberships, products, workspace_products,
    // subscriptions) must go through src/lib/corePrisma.ts. The
    // admin/postgres client in src/lib/prisma.ts bypasses RLS
    // entirely and must never be used for these tables. Scoped to
    // wherever that server-side Core code lives -- update this glob
    // if that location changes.
    files: [
      "src/lib/core/**/*.{ts,tsx}",
      "src/**/core/**/*.{ts,tsx}",
      "src/app/app/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/prisma",
              message:
                "Core-table code must use corePrisma's withUserContext (src/lib/corePrisma.ts), never the admin/postgres client -- it bypasses RLS entirely.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
