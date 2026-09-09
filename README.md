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

## Connecting the Setu AA sandbox

Bank data arrives through [Setu's Account Aggregator gateway](https://docs.setu.co/data/account-aggregator).
The app runs fine without it — `/connect-bank` degrades to a clear "not
configured" message rather than crashing (CONVENTIONS.md #5) — but nothing
imports until a sandbox project exists.

1. **Create the FIU and product.** On [bridge.setu.co](https://bridge.setu.co),
   go to Account Aggregator → **Set up another FIU** (company PAN and GSTIN;
   sandbox does not validate them) → open **FIU businesses**, pick the
   account, and create the **Account Aggregator - Data** product.
2. **Configure the consent object** in Step 1. Purpose, FI types, fetch type
   and consent mode all live on the Bridge, not in this codebase — the app
   only sends the parts that vary per request (who, how long, over what date
   range, where to redirect back to). What SpendWise needs:

   | Setting | Value | Why |
   |---|---|---|
   | Purpose | **102** — spending pattern analysis | Literally what this app does; the purpose code is shown to the user on the approval screen |
   | FI types | **DEPOSIT** | Savings/current accounts. Add others only when the app can actually render them |
   | Consent types | **TRANSACTIONS**, plus SUMMARY and PROFILE | Transactions are the product; summary carries the account type and balance |
   | Fetch type | **PERIODIC** | ONETIME allows a single data session ever, so every sync after the first would fail |
   | Consent mode | **STORE** | Transactions are written to our own database, not just displayed |
   | Frequency | as high as the form allows | Only `POST /sessions` counts against it, but the default of **1 per hour** means a second manual sync within the hour is rejected |

   Two things worth setting deliberately while you are in there: the
   **purpose text** shown on the approval screen defaults to Setu's loan
   example ("To verify your income and calculate loan offer"), which is not
   what this app does; and under *Advanced options*, leave auto-fetch off
   (the app opens its own data sessions) but turn **partial fetch on**, so
   one slow FIP doesn't cost you the accounts that did respond.

3. **Copy the credentials** from *Step 2 — Test your product* into `.env`:
   `SETU_CLIENT_ID`, `SETU_CLIENT_SECRET`, `SETU_PRODUCT_INSTANCE_ID`.
   Leave `SETU_AA_BASE_URL` at the sandbox host.
4. **Point Setu's notifications at this app.** Setu posts consent and data
   updates server-to-server, so `localhost` is not reachable — expose the
   dev server with a tunnel and set the Bridge notification URL to
   `https://<your-tunnel>/api/aa/webhook`. If the Bridge lets you attach a
   shared secret, put the same value in `SETU_WEBHOOK_SECRET` and the route
   will require a matching `x-setu-signature`.
5. **Smoke-test the credentials before touching the app.** This exercises
   the gateway from the terminal — no database row, no sign-in — and prints
   what the parsers made of each response, so a renamed field shows up as
   one line of output instead of an empty screen:
   ```bash
   npm run setu:smoke -- consent 9999999999
   ```
   `9999999999` is the sandbox's seeded customer; a number that isn't seeded
   comes back as `400 Customer vua not found`.
   Approve at the printed URL, then `npm run setu:smoke -- status <id>` and
   `npm run setu:smoke -- fetch <id>`. Add `--raw` to any of them to see
   Setu's untouched JSON alongside the parsed result.
6. **Run the flow for real.** Sign in, open `/connect-bank`, enter a
   10-digit mobile number, and approve on Setu's screens. Sandbox accounts
   are seeded against Setu's test mobile numbers and OTPs — the current list
   is in your Bridge project's test panel, since it changes independently of
   this repo.

What happens after you approve:

| Step | Route | What it does |
|---|---|---|
| Consent raised | `POST /api/aa/consent` | Creates the consent with Setu and records `aa_consents` (the only mapping from Setu's consent id back to a user) |
| Back from Setu | `POST /api/aa/link` | Re-reads the consent, creates a `LinkedAccount` per account approved, opens a data session |
| Data fetch | `POST /api/aa/sync` | Pulls the session and upserts transactions, categorizing on the way in |
| Out of band | `POST /api/aa/webhook` | Same two steps, driven by Setu's notifications, for users who close the tab |

**Sync is idempotent and never overwrites a human.** Re-running it no-ops
rows already stored (`[linkedAccountId, externalId]` is a real compound
unique) and leaves any category the user set by hand alone.

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
| `npm run db:categorize -- <email>` | Apply merchant rules to existing uncategorized transactions (`--dry-run` to preview) |
| `npm run setu:smoke -- <cmd>` | Probe the Setu AA sandbox from the terminal (`consent` / `status` / `fetch`, `--raw`) |

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
