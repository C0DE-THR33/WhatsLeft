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
  proxy.ts                             refreshes the session + redirects signed-out
                                        users to /login (Next 16 renamed middleware.ts)
  app/
    onboarding/, connect-bank/        public / auth-gated top-level screens, no bottom nav
    login/                            magic-link sign-in (no dedicated screen in design/)
    auth/callback/                    magic-link callback: exchanges code, upserts User
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
    auth/SignOutButton.tsx            client-side sign-out, used on Settings
    nav/BottomNav.tsx                 shared tab bar
    transactions/CategoryTile.tsx     the icon-tile system used everywhere
    transactions/CategorizeSheet.tsx  the categorize bottom sheet
    transactions/TransactionsList.tsx client half of Transactions (filter + categorize)
  lib/
    db.ts                             Prisma client singleton
    queries.ts                        every real Prisma query, one per page's needs
    setu.ts                           Setu AA API wrapper
    auth.ts                           current-user lookup, backed by Supabase Auth
    categories.ts                     category metadata, single source of truth
    dates.ts, donut.ts                pure helpers (month/day math, donut segment math)
    supabase/client.ts, server.ts, proxy.ts   Supabase SSR client factories
prisma/
  schema.prisma                       full data model + design rationale in comments
design/
  *.dc.html, canvas.json              the UI concept canvas
```

## What's real vs. stubbed right now

This is a repository **structure**, not a finished app. Concretely:

- `lib/db.ts`, `lib/categories.ts`, `components/*`, the `categorize` and
  `categories` API routes, and the Prisma schema are fully implemented.
- **Auth is wired up end to end**: `src/proxy.ts` protects every route
  except `/`, `/onboarding`, `/login`, and `/auth/*`, redirecting signed-out
  visitors to `/login?redirect=<path>`; `/login` sends a Supabase magic
  link; `/auth/callback` exchanges it for a session and creates the
  matching `User` row (see that model's comment in `prisma/schema.prisma`
  for why that row can't just be `auth.users`). If
  `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` aren't
  set, `src/proxy.ts` logs a warning and skips enforcement entirely (every
  route is open) rather than crashing — intentional, so the app is still
  browsable before a Supabase project exists. But the `(app)/*` pages
  themselves now call Supabase directly too (to read the session for real
  queries — see below), so `src/app/(app)/error.tsx` is what actually
  keeps *those* pages from 500ing pre-setup: it catches
  `SupabaseNotConfiguredError` and shows a plain "connect Supabase" message
  instead of a crash. `/`, `/onboarding`, `/login`, `/connect-bank` don't
  depend on that boundary — they handle the unconfigured case inline.
- **Every `(app)/*` page reads real data through `lib/queries.ts`** —
  no hardcoded sample arrays left. Home/Budget/Analytics all key off the
  current calendar month; Transactions fetches the latest 100 rows and
  the categorize sheet PATCHes the real API route (which now also checks
  the transaction belongs to the caller — it didn't before). Spend that
  has no category is tracked as its own "Uncategorized" slice rather than
  silently dropped, so category percentages always add up to 100%.
  `LinkedAccount.currentBalance` was added to the schema — the design's
  "Total balance" card had nothing to sum without it. New users see real
  empty states (no accounts/budget/transactions), not zeros dressed up as
  data.
  **Caveat**: none of this has run against a live database — no Supabase
  project existed to test against. Every query passed TypeScript against
  Prisma's generated types (which does catch wrong field/relation/enum
  names), and the trickier pure logic (month-boundary rollover for the
  6-month trend, category percentage math, date-bucketing) was verified
  with standalone scripts — but the actual SQL Prisma generates has not
  been executed. Worth a careful pass once `DATABASE_URL` points at a
  real database, especially `getAnalyticsData`'s trend/highest-category
  math.
- `lib/setu.ts` and the `aa/*` routes follow the *shape* Setu's docs
  describe, but the exact request/response field names haven't been
  verified against a live sandbox call yet — there were no sandbox
  credentials available when this was written. Check
  [Setu's Postman collection](https://documenter.getpostman.com/view/16080598/TzzBoun5)
  against each `TODO` in `lib/setu.ts` before relying on it.

## Local setup

1. `cp .env.example .env` and fill in:
   - `DATABASE_URL` — Supabase project → Database → Connection string.
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` —
     Supabase project → API Keys. Use the new **publishable** key, not the
     legacy `anon` JWT key (Supabase is deprecating `anon`/`service_role`
     by end of 2026).
   - `SETU_*` — sign up at [bridge.setu.co](https://bridge.setu.co/v2),
     create an Account Aggregator (Data) app, sandbox mode.
   - `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_POSTHOG_KEY` — optional until
     categorization/analytics are wired up.
2. In Supabase Dashboard → Authentication → URL Configuration, add
   `http://localhost:3000/auth/callback` as a redirect URL (required for
   the magic-link sign-in to come back to this app instead of erroring).
3. `npm install`
4. `npx prisma migrate dev --name init` — creates the tables in Supabase
   and generates the Prisma client.
5. `npm run dev`

Note: `prisma`/`@prisma/client` are pinned to `6.19.3`. Prisma 7 replaced
the classic CLI (`generate`, `migrate dev`) with a different, platform-hosted
workflow (`deploy`, `branch`, `contract`, ...) built around Prisma's own
hosted Postgres — not what this project's self-hosted Supabase + migrations
setup is built around, so don't bump past 6.x without re-checking that.
