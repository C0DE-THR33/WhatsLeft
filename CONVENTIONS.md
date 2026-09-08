# SpendWise — Project Conventions

This is the document we wish had existed before we started. It's written
as if SpendWise were being built from scratch today (September 2026),
distilling everything the first build actually taught us — including
three things that turned out different from what a knowledgeable
engineer would have assumed going in. Read this before writing code, not
after debugging why something didn't match your mental model.

**A living document, not a spec.** When a convention here stops matching
reality — a library moves on, a pattern gets replaced — update this file
in the same commit. A conventions doc that's quietly wrong is worse than
none.

---

## 1. Stack, and why each piece is pinned the way it is

| Layer | Choice | Pinned at |
|---|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS v4 | Next 16.3.4 |
| Backend | Next.js Route Handlers (no separate API server) | — |
| Database | PostgreSQL via Supabase | — |
| ORM | Prisma, **classic CLI** | `prisma` / `@prisma/client` `6.19.3` |
| Auth | Supabase Auth (magic link) via `@supabase/ssr` | `0.12.6` |
| Bank data | Setu Account Aggregator sandbox | — |
| Categorization | Claude API (rules first, LLM for ambiguous cases) | — |
| Analytics | PostHog | — |

**Why the exact pins matter here, specifically**: `npm install prisma`
today resolves to **7.10.0**, a from-scratch CLI rewrite (`deploy`,
`branch`, `contract`, no `generate`/`migrate dev`) built around Prisma's
own hosted Postgres — architecturally incompatible with a self-hosted
Supabase + migrations setup. `6.19.3` is the last release with the
classic CLI this whole project assumes. **Don't bump `prisma`/
`@prisma/client` past 6.x without re-reading this paragraph and checking
whether the classic CLI still exists at whatever version you're
considering.**

More generally: **verify a library's current shape against its own
current docs before writing code against it, every time, even for
libraries you're confident about.** Training-data familiarity is exactly
what makes a breaking change invisible until it breaks. This project hit
three of these in one session (below) — none would have been caught by
"I already know how this works."

---

## 2. Repository layout

```
design/                    UI concept: *.dc.html + canvas.json, a design
                            canvas (not the app) — see "Design system" below
prisma/
  schema.prisma             full data model, with rationale in comments,
                             not just field lists
  seed.ts                   defaults only (categories) — safe to run
                             against ANY environment
  seed-demo.ts               rich demo data for ONE named user — requires
                             that user to already exist (real sign-in first)
src/
  proxy.ts                  session refresh + redirect-to-/login (see
                             "Next.js 16 renamed middleware" below)
  app/
    onboarding/, connect-bank/, login/, auth/callback/
                             top-level screens outside the tab-bar shell
    (app)/                  route group sharing the bottom-nav shell;
                             `export const dynamic = "force-dynamic"` on
                             its layout.tsx (see "Force-dynamic" below)
      error.tsx              one error boundary for the whole group
    api/                    Route Handlers, one folder per resource
  components/
    <domain>/Component.tsx  grouped by domain (transactions/, nav/, auth/),
                             not by "atoms/molecules" or type
  lib/
    queries.ts               the ENTIRE query layer — see below
    auth.ts                  current-user lookup, the one place that
                             calls Supabase for "who is this"
    supabase/{client,server,proxy}.ts
                             three client factories, never construct a
                             Supabase client any other way
    categories.ts, dates.ts, donut.ts
                             pure, dependency-free helpers — the kind of
                             logic you can unit-test without a database
                             (and should, see "Verification" below)
```

**Rule**: a file's location should answer "where do I look for X" without
needing to know who wrote it. If you're unsure whether something is a
`lib/` helper or a `components/` piece, ask: does it return JSX? If no,
`lib/`.

---

## 3. Design system

The design canvas (`design/*.dc.html`) is the **source of truth** for
visual decisions — colors, spacing, the icon-tile system, copy tone. Code
should port it faithfully, then extend it, never invent a parallel
aesthetic. Concretely:

- **Every color is a CSS custom property**, defined once in
  `src/app/globals.css`'s `:root` and mapped into Tailwind's `@theme
  inline` block, so `bg-accent`, `text-danger-fg`, `bg-cat-food` etc. are
  real utility classes, not one-off hex codes sprinkled through
  components. If a design decision needs a new color, it gets a token
  first, a usage second.
- **`@layer base` for anything that could win the cascade it shouldn't.**
  A bare `a { color: ... }` outside a layer beats *every* Tailwind
  utility on every link, specificity be damned — the CSS cascade-layers
  spec puts any unlayered rule ahead of any layered one. Anything that
  isn't itself a utility override belongs in `@layer base`.
- **The icon-tile system** (`components/transactions/CategoryTile.tsx`)
  is the one way a category ever renders — a colored rounded-square tile
  with a hand-drawn stroke-SVG icon, `size="sm"|"md"|"lg"`, an optional
  `selected` ring+badge state. A `DashedTile` sibling covers "uncategorized"
  and "add category." Never fall back to a plain colored dot or a letter
  avatar for a category once this exists — consistency across every
  screen is the entire point (see the "uncategorized as a full citizen"
  entry below for why this discipline matters).
- **No fake OS chrome.** Never draw a fake status bar or virtual keyboard
  inside a mobile mockup or a real page — the real one renders on top and
  a painted fake looks doubled up.
- **Icons are inline stroke-SVG, one consistent grid (16/20/24px),
  `currentColor` or an explicit stroke — never emoji, never a icon font.**

---

## 4. Data layer conventions

**One query function per page's actual need, in `lib/queries.ts`, called
directly from a Server Component.** Not a generic repository/DAO
abstraction, not a GraphQL-style resolver graph — a page needs `getBudgetData(userId)`,
it gets exactly that function, returning exactly the shape that page
renders. Shared logic (this month's category breakdown, used by both
Home and Analytics) is a private helper inside `queries.ts`, not
duplicated.

- **Server Components fetch; Client Components only hold interaction
  state.** A page that's mostly display with a little interactivity
  (Transactions) splits into `page.tsx` (server, fetches, `async`) +
  a client component that receives the fetched data as props and owns
  only the UI state (filter selection, sheet open/closed).
- **Decimal fields**: Prisma returns `Prisma.Decimal`, not `number`.
  Every query function converts with a `toNum()` helper at the boundary —
  never let a `Decimal` leak into a component prop or a `.toLocaleString()`
  call.
- **A DB column typed as plain `string` that's conceptually a closed set**
  (`Category.icon` is one of six known values, but Postgres doesn't
  enforce that) **needs a runtime narrowing function at the read boundary**
  (`asCategoryIcon()`), not a cast. Log and fall back on an unexpected
  value; never let one bad row crash a whole page render.
- **A percentage breakdown of "spend by category" must account for spend
  that has no category**, or the percentages silently don't sum to 100%
  and the gap is invisible. Give "uncategorized" its own row in the
  breakdown (see the retrospective below) rather than excluding it from
  the total.
- **Every list-fetching query has a real empty-state design**, decided
  at the same time as the query, not bolted on later. "What does this
  page look like for a brand-new user with nothing yet" is a product
  question, answer it before writing the JSX.

---

## 5. Auth conventions

- **`src/proxy.ts`** (not `middleware.ts` — see below) refreshes the
  session and redirects unauthenticated requests away from anything not
  on an explicit public-path allowlist. **Uses `getClaims()`, never
  `getSession()`** — `getClaims()` verifies the JWT signature;
  `getSession()` trusts whatever the request's cookies claim, which is
  not a safe basis for a security decision.
- **`lib/auth.ts`'s `getCurrentUser()`/`getCurrentUserId()`** is the
  *only* place application code asks "who is signed in." It upserts the
  matching Prisma `User` row defensively (the real creation happens in
  `auth/callback/route.ts` right after sign-in; this is a second line of
  defense for a session that predates that, not the primary path).
- **Every mutating API route checks both auth AND ownership.** `getCurrentUserId()`
  proves *someone* is signed in; it does not prove the resource being
  mutated belongs to them. A `Transaction` reaches its owner only via
  `linkedAccount.userId` — the correct guard is `updateMany({ where: { id,
  linkedAccount: { userId } } })`, checking `result.count === 0` for "not
  found or not yours," never a bare `update({ where: { id } })`. This
  isn't a hypothetical: the first version of the categorize route shipped
  without this check.
- **A page or route reading Supabase must degrade gracefully when
  Supabase isn't configured**, not throw a raw error — see "SupabaseNotConfiguredError"
  below. This matters more than it sounds: it's the difference between a
  freshly cloned repo being demoable before `.env` is filled in, and
  every single page 500ing.

---

## 6. Database conventions

- **A nullable column in a compound `@@unique` can't back an `upsert`.**
  Postgres treats every `NULL` as distinct for uniqueness purposes, so
  `ON CONFLICT` never fires when the nullable column is null — an
  `upsert` intended as "create once" silently inserts a fresh duplicate
  on every re-run instead. `Category.userId` (null = a shipped default)
  is exactly this shape; `MonthlyBudget`/`CategoryBudget` are split into
  two tables specifically to avoid ever needing a nullable column in a
  unique constraint. Where a nullable-key upsert seems needed, use
  `findFirst` + conditional `create` instead.
- **Two seed scripts, two different safety levels.** `seed.ts` (shipped
  defaults, e.g. categories) is safe to run against any environment,
  any number of times. `seed-demo.ts` (rich sample data for one named
  user) is explicitly separate, takes an identifying argument, and
  fails loudly if its precondition (a real signed-in user already
  exists) isn't met. Never conflate "safe defaults" and "demo data" in
  one script.
- **Money is `Decimal(12, 2)`, never `Float`/`Int`.** Convert to `number`
  only at the read boundary (see "Data layer" above), never store or
  compute in floating point.
- **Every schema addition needs a reason written down in the schema
  file itself**, not just in a commit message — `schema.prisma`'s
  comments are the first thing anyone (human or agent) reads to
  understand *why* a table is shaped the way it is, and commit history
  is easy to not think to check.

---

## 7. Environment variables

- **Supabase**: use the **publishable**/**secret** key pair
  (`sb_publishable_...`/`sb_secret_...`), not the legacy `anon`/
  `service_role` JWT-shaped keys — Supabase is deprecating the legacy
  pair by end of 2026. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, not
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Two database URLs, not one**, because Next.js on Vercel is
  serverless: `DATABASE_URL` is the transaction-mode pooled connection
  (port 6543, `?pgbouncer=true`) the *app* uses at runtime — a
  serverless function can't hold a direct connection open without
  exhausting Postgres's connection limit. `DIRECT_URL` is the
  session-mode/direct connection (port 5432) that `prisma migrate`
  needs, since migrations need prepared statements a transaction-mode
  pooler can't sustain. Get both from Supabase's **Connect → ORMs →
  Prisma** tab, pre-filled except the password.
- **`.env.example` is the map of every variable the app needs, with a
  comment on where to get each one** — not just a name and an empty
  string. Someone cloning this repo should be able to go from
  `.env.example` to a working `.env` without leaving the README once.

---

## 8. Verification discipline

This is the part most worth carrying into a fresh start, and the part
that caught every real bug in this project so far.

- **Run it. Don't just read the diff.** `npm run build && npm run lint`
  after every meaningful change, no exceptions — TypeScript against
  Prisma's generated types catches wrong field/relation/enum names,
  which is real signal, not theater.
- **A build passing is not the same as a page working.** Start the dev
  server, actually navigate to the page, actually click the button.
  Two of this project's real bugs (a login button stuck forever on
  "Sending…", a route-group crash that only showed up with zero
  Supabase config) were invisible to `tsc` and only surfaced by loading
  the actual page in a browser.
- **Pure logic gets a standalone test, even without a test framework
  set up.** Donut-chart segment math, date-bucket edge cases, month-
  boundary rollover across a year boundary — none of these need a
  database or a browser to verify, so a five-line throwaway Node script
  checking the actual output against hand-computed expected values is
  cheap insurance. Delete the script after; keep the confidence.
- **When you can't run the real thing (no live database existed for
  most of this build), say so plainly, and say what you did instead** —
  don't imply verification that didn't happen. "TypeScript passed
  against Prisma's generated types" is a real, specific claim; "this
  should work" is not.
- **Before writing code against a library you're confident about,
  check whether that confidence is current.** This project's three real
  surprises this way:
  - `prisma` resolved to a completely different CLI (7.x) than the
    classic one every tutorial assumes.
  - Next.js 16 renamed `middleware.ts` → **`proxy.ts`**, and moved its
    expected location to alongside `app/` rather than the project root.
  - Supabase renamed `anon`/`service_role` keys to `publishable`/
    `secret`, and the docs' own recommended cookie-handling shape
    (`getAll`/`setAll`, `getClaims()` over `getSession()`) had moved on
    from what training data would suggest.

  All three would have shipped silently wrong without a docs check.
  None of them were exotic — they were exactly the parts a confident
  engineer skips checking.

---

## 9. Git conventions

- **A commit message states what changed, why, what was verified, and
  what wasn't** — not just "wire up X." If a change fixed a bug found
  while building something else, say what the bug was and how it was
  found; that's the information a future reader (human or agent) most
  needs and least often gets.
- **`git status` before staging broadly, always** — review what's about
  to be committed, not just what you meant to change. A `.gitignore`
  gap (this project's `.env*` blanket rule initially ate `.env.example`
  too) is easy to introduce and easy to miss without looking.
- One logical change per commit; a commit that mixes "add feature" with
  "also fix an unrelated bug I noticed" makes both harder to review and
  harder to revert independently.

---

## 10. If we were starting today, what we'd do differently from minute one

- **Check current docs for every major dependency before scaffolding,
  not after hitting a surprise.** Five minutes of "what does Prisma's
  CLI look like today, what does Next's middleware convention look like
  today" up front would have prevented every rework in this list.
- **Design the empty state and the "who owns this row" check at the same
  time as the happy path**, not as a follow-up pass — both of this
  project's real security/correctness bugs (the missing ownership check,
  the uncategorized-spend percentage gap) were exactly the kind of thing
  that's obvious in hindsight and invisible while focused on the primary
  flow.
- **Decide the pooled/direct database URL split before the first
  migration**, not after deploying — retrofitting it is a schema change
  and an env var rename touching every environment.
- **Build the design canvas and the code's design tokens from the same
  source values from day one** (this project did do this — `globals.css`'s
  `:root` block is a direct copy of the canvas's CSS variables — worth
  keeping deliberate as the project grows, since the two are easy to
  let drift once there are more than a handful of screens).
