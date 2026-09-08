# SpendWise

See where your money goes, without the spreadsheet. A Next.js full-stack
app for tracking spending, budgets, and (eventually) investments — bank
data comes in automatically via India's Account Aggregator network, so
there's no manual entry for day-to-day transactions.

Read [CONVENTIONS.md](./CONVENTIONS.md) before making changes — it's the
project's actual design decisions and the reasoning behind them, not just
a style guide.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · PostgreSQL via
Supabase · Prisma (classic CLI, 6.x) · Supabase Auth (magic link) · Setu
Account Aggregator (sandbox) · Claude API for categorization · PostHog

See CONVENTIONS.md §1 for exactly why each version is pinned where it is —
worth reading before bumping any of them.

## Getting started

1. **Create a Supabase project.** [supabase.com](https://supabase.com) →
   New project.
2. **Copy the env template and fill it in:**
   ```bash
   cp .env.example .env
   ```
   Every variable in `.env.example` has a comment saying exactly where to
   get it — Supabase keys and both database URLs come from your project's
   **Connect** panel (**ORMs → Prisma** tab for the database URLs). Setu
   and Claude API keys are optional for exploring the UI — pages that need
   them degrade gracefully (a disabled button, a clear message) rather
   than crashing when they're unset.
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Push the schema and generate the Prisma client:**
   ```bash
   npx prisma migrate dev --name init
   ```
5. **Seed the default categories** (safe to run anytime, any environment):
   ```bash
   npm run db:seed
   ```
6. **Run the app:**
   ```bash
   npm run dev
   ```
7. Sign in with a magic link at `/login`, then optionally seed rich demo
   data for that account (requires signing in once first):
   ```bash
   npm run db:seed:demo -- you@example.com
   ```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Regenerate the Prisma client after a schema change |
| `npm run db:migrate` | Create/apply a migration (`prisma migrate dev`) |
| `npm run db:seed` | Seed shipped defaults (categories) |
| `npm run db:seed:demo -- <email>` | Seed rich demo data for one existing user |
| `npm run dev:signin -- <email>` | Mint a sign-in link without sending email (dev only) |

### Signing in locally

Supabase's built-in email service is rate-limited to roughly **2 messages
per hour, project-wide** — it exists for testing, not real use — so the
normal magic-link flow stalls quickly in development, and it can't work
at all for a demo address that isn't a real mailbox. For local work, mint
a link directly instead:

```bash
npm run dev:signin -- you@example.com
```

Paste the printed URL into whichever browser you want signed in. It's
single-use and expires, so run it again for a fresh one. Requires
`SUPABASE_SECRET_KEY` in `.env`.

Before anyone other than you signs in, configure custom SMTP under
**Authentication → SMTP Settings** in the Supabase dashboard — that
removes the cap and makes the real magic-link flow usable.

## Verification

Before committing, at minimum:

```bash
npm run build && npm run lint
```

A passing build is necessary but not sufficient — see CONVENTIONS.md §8
before assuming a page actually works from that alone.
