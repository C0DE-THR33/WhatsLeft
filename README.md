# SpendWise

A personal money manager that reads bank transactions automatically via
India's RBI Account Aggregator (AA) framework, instead of manual entry —
built as a product-management + engineering portfolio project.

- **v1 (this repo):** AA-linked transaction import, budgets, analytics,
  categorization.
- **Phase 2 (scoped, not built):** Bill Scanner (OCR + AI line-item
  categorization), Investments (manual entry, later AA mutual-fund data).

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) + TypeScript, Tailwind CSS |
| Backend | Next.js API routes |
| Database | PostgreSQL via Supabase, accessed through Prisma |
| Auth | Supabase Auth |
| Bank data | Setu's Account Aggregator sandbox (`src/lib/setu.ts`) |
| Categorization | Claude API (Anthropic), rules first, LLM for ambiguous cases |
| Analytics | PostHog |

See [`design/`](./design) for the UI concept this is built from — a
multi-screen canvas covering the full v1 flow plus the two Phase 2
placeholder screens.

## Repository structure

```
src/
  app/
    onboarding/, connect-bank/        top-level screens, no bottom nav
    (app)/                            route group sharing the bottom-nav shell
      layout.tsx                      renders <BottomNav/> + the active tab
      home/, transactions/, budget/, analytics/
      more/                           nav hub
        bill-scanner/, investments/, settings/
    api/
      aa/consent/                     POST — start a Setu consent request
      aa/webhook/                     POST — Setu's consent + FI-data notifications
      aa/sync/                        POST — pull FI data for an active consent
      transactions/[id]/categorize/   PATCH — confirm/override a category
      categories/                     GET — default + user categories
  components/
    nav/BottomNav.tsx                 shared tab bar
    transactions/CategoryTile.tsx     the icon-tile system used everywhere
  lib/
    db.ts                             Prisma client singleton
    setu.ts                           Setu AA API wrapper
    auth.ts                           current-user lookup (stub — see below)
    categories.ts                     category metadata, single source of truth
prisma/
  schema.prisma                       full data model + design rationale in comments
design/
  *.dc.html, canvas.json              the UI concept canvas
```

## What's real vs. stubbed right now

This is a repository **structure**, not a finished app. Concretely:

- `lib/db.ts`, `lib/categories.ts`, `components/*`, the `categorize` and
  `categories` API routes, and the Prisma schema are fully implemented.
- `lib/auth.ts` is a stub — every route that needs "the current user" calls
  `getCurrentUserId()`, which throws until Supabase Auth is wired up. That's
  the next concrete piece of work.
- `lib/setu.ts` and the `aa/*` routes follow the *shape* Setu's docs
  describe, but the exact request/response field names haven't been
  verified against a live sandbox call yet — there were no sandbox
  credentials available when this was written. Check
  [Setu's Postman collection](https://documenter.getpostman.com/view/16080598/TzzBoun5)
  against each `TODO` in `lib/setu.ts` before relying on it.
- Every page under `app/(app)/` is a minimal stub with a comment pointing
  at its full mockup in `design/`, except Home, which has a small working
  slice (sample data through the real `CategoryTile` component) to prove
  the pattern before porting the rest screen by screen.

## Local setup

1. `cp .env.example .env` and fill in:
   - `DATABASE_URL` — Supabase project → Database → Connection string.
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` /
     `SUPABASE_SERVICE_ROLE_KEY` — Supabase project → API.
   - `SETU_*` — sign up at [bridge.setu.co](https://bridge.setu.co/v2),
     create an Account Aggregator (Data) app, sandbox mode.
   - `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_POSTHOG_KEY` — optional until
     categorization/analytics are wired up.
2. `npm install`
3. `npx prisma migrate dev --name init` — creates the tables in Supabase
   and generates the Prisma client.
4. `npm run dev`

Note: `prisma`/`@prisma/client` are pinned to `6.19.3`. Prisma 7 replaced
the classic CLI (`generate`, `migrate dev`) with a different, platform-hosted
workflow (`deploy`, `branch`, `contract`, ...) built around Prisma's own
hosted Postgres — not what this project's self-hosted Supabase + migrations
setup is built around, so don't bump past 6.x without re-checking that.
