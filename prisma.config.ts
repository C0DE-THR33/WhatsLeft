import { defineConfig } from "prisma/config";

// Prisma's classic CLI (6.19.3, see CONVENTIONS.md #1) still reads
// package.json#prisma but deprecates it in favor of this file — checked
// against the installed CLI's own shipped types (@prisma/config), not
// assumed from memory.
//
// One side effect worth knowing: once a prisma.config.ts exists, the CLI
// stops auto-loading `.env` the way it used to under package.json#prisma
// ("Prisma config detected, skipping environment variable loading"). Load
// it ourselves with Node's built-in loader — `prisma generate` doesn't
// need DATABASE_URL, so a missing `.env` (a fresh clone, before setup) is
// fine to swallow here; `prisma migrate` will fail with its own clear
// error if the vars really aren't set.
try {
  process.loadEnvFile(".env");
} catch {
  // no .env yet — fine for `prisma generate`, `prisma migrate` will
  // complain loudly on its own if DATABASE_URL is actually missing.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
