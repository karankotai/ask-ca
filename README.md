# RegMitra

> **AI-powered regulatory intelligence for practicing Company Secretaries.**
>
> Monitors every RBI circular, maps obligations to each NBFC client's SBR layer and profile, and drafts branded compliance advisories — before anyone else has finished reading the circular.

Built with Next.js 16 App Router, Prisma (Postgres), NextAuth v5 Credentials, TypeScript, and a dark token-based design system. Includes a public marketing homepage with a **one-click demo dashboard** that drops visitors straight into the authenticated shell without signing up.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | **Next.js 16** (App Router, React 19, Turbopack) |
| Language | **TypeScript 5** (`tsc --noEmit` enforced, strict) |
| Styling | Global CSS tokens (`.m-*` marketing, app tokens in `src/app/globals.css`) — **not** Tailwind |
| Auth | **NextAuth v5 beta** (`@auth/nextjs` / `@auth/core`) — Credentials provider (2 providers: `credentials`, `demo`) |
| Password hashing | `bcryptjs` (10 rounds) |
| Database | **Postgres** via **Prisma 6** (Neon / Supabase compatible) |
| Schema validation + env | `zod` — runtime env boot validation in `src/lib/env.ts` |
| Logging | Structured `logInfo / logWarn / logError` helpers in `src/lib/logging.ts` |
| APIs | Route Handlers in `(dashboard)/api/*` and `(marketing)/api/*` route groups |

---

## Features

- **Public marketing homepage** at `/` — dark radial-gradient landing page, 7 sections: sticky blurred nav, hero w/ waitlist form + demo CTA, 5-client product preview card, 3-step "How it works" with circular/advisory/calendar mocks, 4 capability cards + 4 stat tiles, gradient CTA, footer.
- **"Try the dashboard" → no sign-in demo.** Any visitor POSTs to `/api/auth/demo-login`, NextAuth server `signIn("demo")` issues a 30-day HTTPOnly session cookie as `demo@regmitra.com` (admin role), and redirects straight to `/dashboard` with the full sidebar shell loaded. Works even if the `User` table hasn't been pushed to Postgres yet.
- **Authenticated dashboard shell** with sidebar nav, per-client profile pages, workspace banner + identity footer.
- **10 audit pages** pushed in sessions before this README: Dashboard, Circulars, Calendar, Briefings, Analyze, Obligations, Evaluate, Admin, Client profile, Sign up.
- **Enforced auth gate.** `(dashboard)/layout.tsx` is an async RSC that calls `getSessionSafe()`. No session → server-side 307 redirect `/login`. No flash of unauthed content.
- **First-user admin bootstrap.** `/api/auth/register`:
  - `prisma.user.count() === 0` → public registration open → first user **always created with `role = "admin"`**.
  - After count ≥ 1 → endpoint is locked. Requires active session **and** `role === "admin"`; otherwise 401/403.
- **Legacy admin fallback.** If the `User` table is empty or missing, the `credentials` authorize flow still allows the `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` env pair — useful for demo installs before migrations.
- **Canonical URL middleware** at `middleware.ts` redirects apex-to-www, non-canonical to `NEXT_PUBLIC_APP_URL`, and includes a minimal path prefix (not touched in this session beyond env reference).

---

## Project Structure

```
ask-ca/
├── prisma/
│   ├── schema.prisma              # User, Obligation, Circular, etc. (Postgres provider)
│   └── demo-migration.sql         # Demo DDL + seed data
├── docs/DEMO.md                   # Data bootstrap: psql .sql + npm run demo:*
├── src/
│   ├── app/
│   │   # ── 3 Next.js App Router ROUTE GROUPS (parentheses = stripped from URL) ──
│   │   ├── (marketing)/           # Public landing. NO sidebar chrome.
│   │   │   ├── layout.tsx         # Empty children-only passthrough
│   │   │   ├── page.tsx           # "/" → session check → redirect /dashboard or render <MarketingPage/>
│   │   │   ├── MarketingPage.tsx  # Full 7-section marketing client page + 3 Try-it-out buttons
│   │   │   └── api/auth/
│   │   │       └── demo-login/route.ts   # POST → signIn("demo") → 303 /dashboard
│   │   │
│   │   ├── (dashboard)/           # Authenticated sidebar shell + all private routes/APIs
│   │   │   ├── layout.tsx         # Async RSC auth gate: no session → 307 /login
│   │   │   ├── dashboard/page.tsx # Canonical "/dashboard" (moved OUT of "/")
│   │   │   ├── circulars|calendar|briefings|analyze|obligations|evaluate|admin|clients/
│   │   │   └── api/
│   │   │       ├── auth/[...nextauth]/route.ts   # NextAuth catch-all
│   │   │       └── auth/register/route.ts        # First-user admin bootstrap
│   │   │
│   │   ├── login/page.tsx         # Standalone dark card (no sidebar chrome)
│   │   ├── signup/page.tsx        # Public → closed registration gate
│   │   └── globals.css            # App tokens + ~950 lines of .m-* marketing design tokens
│   │
│   ├── components/
│   │   ├── Sidebar.tsx            # 12-item nav, Dashboard href="/dashboard", match "/|/dashboard"
│   │   ├── LoginForm.tsx
│   │   ├── SignUpForm.tsx
│   │   └── …
│   └── lib/
│       ├── auth.ts                # NextAuth v5 config + 2 providers (credentials / demo) + session helpers
│       ├── env.ts                 # Zod RequiredRuntimeSchema + optional schemas + boot warnings
│       ├── prisma.ts              # Global single PrismaClient
│       └── logging.ts
└── package.json → scripts: dev, build, start, lint, demo:seed, demo:precompute
```

### URL route summary

| URL | Route group | Auth required? |
|---|---|---|
| `/` | `(marketing)` | No — public marketing page; authed users are 307 → `/dashboard` |
| `/dashboard`, `/circulars`, `/calendar`, …, `/clients/*` | `(dashboard)` | **Yes** — async RSC auth gate → 307 `/login` when no session |
| `/login`, `/signup` | outside groups | No — standalone dark cards; if already authed → 307 `/` or `/dashboard` |
| `/api/auth/*` | split | `/api/auth/demo-login` → public (marketing group) <br> `/api/auth/register` → auth-gated after 1st user |

---

## Quick Start

### 1. Install

```bash
cd ask-ca
npm install
npx prisma generate   # creates Prisma client types; runs automatically on npm ci via postinstall
```

### 2. `.env` — copy + fill

```bash
cp .env.example .env   # (if an .example exists; otherwise create from template below)
```

**Required variables** (enforced by Zod RequiredRuntimeSchema — app will warn on boot if missing; pages that hit them will 500):

| Name | Value |
|---|---|
| `DATABASE_URL` | Postgres pooler URL (Neon, Supabase, local Postgres) |
| `NEXTAUTH_SECRET` | `openssl rand -hex 32` — **DO NOT use the dev `regmitra-dev-secret-change-in-production…` string in prod** |
| `AUTH_SECRET` | Same value as `NEXTAUTH_SECRET` (set both for v5 backward compat) |
| `NEXTAUTH_URL` | Full canonical origin, no trailing slash — e.g. `https://app.regmitra.com` |
| `NEXT_PUBLIC_APP_URL` | Same value as `NEXTAUTH_URL` |
| `ADMIN_EMAIL` | Legacy fallback admin email (e.g. `you@yourfirm.com`) |
| `ADMIN_PASSWORD_HASH` | Bcrypt 10-round hash — generate locally with: `node -e 'require("bcryptjs").hash("your-strong-pw",10).then(console.log)'` |

Optional:

| Name | When to set |
|---|---|
| `ANTHROPIC_API_KEY` | Enables AI features (circular interpretation, briefings, analyze chat). Marketing + dashboard UI still work without. |
| `RAG_URL` | Base URL of the sibling `gov-circular-crawler` RAG service. Defaults to your local `:8000` (only valid on dev). Skipped if unset. |
| `NEXT_PUBLIC_FIRM_NAME`, `NEXT_PUBLIC_WORKSPACE_LABEL` | Appear in sidebar workspace banner. Zod defaults to "Karan Kotai & Associates / Demo workspace". |

### 3. Push Prisma schema + load demo data

```bash
# Create tables (User + demo domain tables). Safe; doesn't drop existing columns.
npx prisma db push

# (Optional) Demo data — loads demo DDL + 3 clients + obligations, precomputes KPIs.
# Documented in docs/DEMO.md.
psql "$DATABASE_URL" < prisma/demo-migration.sql
npm run demo:seed
npm run demo:precompute
```

**Even if you skip this**, two things still work:
- The marketing landing `/` and its "Try the dashboard" flow (demo provider bypasses DB entirely → signs in `demo@regmitra.com` admin session cookie directly).
- Legacy admin login at `/login` with `ADMIN_EMAIL` + plaintext password that matches `ADMIN_PASSWORD_HASH`.

### 4. Start dev server

```bash
npm run dev
# → http://localhost:3000
```

### 5. Bootstrap your real admin account

**Before the first signed-up user exists** — registration is OPEN publicly:

1. Visit `/signup`. (If it says "Registration disabled", your `User` table already has a row.)
2. Create an account. This first user is created with **`role = "admin"`** by design.
3. Sign in at `/login` with those credentials. You're in at `/dashboard`.

After `prisma.user.count() >= 1`, `/api/auth/register` automatically requires an authenticated admin session.

---

## Try the Dashboard (one-click demo, no sign-in)

**From the marketing homepage:** click the primary blue **"Try the dashboard"** button in the hero, **"Try it out"** in the nav, or **"Or try the demo dashboard"** at the bottom CTA. Any of these:

1. POSTs a plain HTML form to `/api/auth/demo-login` (works even with JS disabled).
2. Server calls NextAuth `signIn("demo", callbackUrl=<origin>/dashboard)`.
3. NextAuth issues an `authjs.session-token` cookie (HTTPOnly, SameSite=lax, expires ~30 days).
4. Returns 303 → `/dashboard`.
5. `(dashboard)/layout.tsx` reads the session, passes auth gate, renders full sidebar shell as `demo@regmitra.com / Administrator`.

Perfect for Vercel preview URLs where you don't want to hand out passwords.

---

## Pages Reference

| Page | Path | Notes |
|---|---|---|
| Marketing home | `/` | 7 sections. Authed → redirect /dashboard. |
| Login | `/login` | Standalone card. Links to `/signup`. Authed → redirect `/`. |
| Signup | `/signup` | Open only when `count(User) === 0`. Otherwise shows "Registration disabled". |
| Dashboard | `/dashboard` | KPIs + overview |
| Circulars | `/circulars` | Browse/search RBI circulars |
| Calendar | `/calendar` | Compliance calendar across all clients |
| Briefings | `/briefings` | AI generated compliance briefings |
| Analyze | `/analyze` | RAG + AI Q&A (needs ANTHROPIC_API_KEY + RAG_URL) |
| Obligations | `/obligations` | Obligations registry |
| Evaluate | `/evaluate` | Compliance scoring / audit worksheets |
| Admin | `/admin` | User + role mgmt (admin-only UI) |
| Client profile | `/clients/:slug` | Per-client overview + obligations + profile |

---

## Deployment (Vercel)

The app is a standard Next.js 16 project and deploys cleanly to Vercel.

### Vercel project settings

1. **Framework Preset** → Next.js (auto-detected).
2. **Root Directory** → `ask-ca`. The repo root is the monorepo `/ca-app`; the Next.js app lives in the subfolder. Without this, deploy fails immediately (no `package.json` at repo root).
3. **Node version** → ≥ 20.18. If your package.json doesn't pin, add `"engines": { "node": ">=20.18" }`.
4. **Override Build Command** (optional but recommended so schema is always applied before build):
   ```
   prisma generate && prisma db push --skip-generate && next build
   ```

### Environment variables in Vercel → **set BEFORE first deploy**

```
DATABASE_URL
NEXTAUTH_SECRET          # openssl rand -hex 32
AUTH_SECRET              # same value
NEXTAUTH_URL             # https://app.you.com — exact canonical origin, no trailing slash
NEXT_PUBLIC_APP_URL      # same value
ADMIN_EMAIL              # legacy admin
ADMIN_PASSWORD_HASH      # bcrypt 10-round hash
ANTHROPIC_API_KEY        # optional (AI pages; leave empty if demo only)
RAG_URL                  # optional (leave empty if crawler not deployed)
```

### Post-deploy first-time setup

1. Open marketing `/`. Confirm radial dark background + "Try the dashboard" hero.
2. Click **Try the dashboard** → should land directly on `/dashboard` with sidebar shell (no login redirect).
3. Hit `/signup` → create your admin (only works before first user exists).
4. If User table missing → sign in via the legacy admin credentials on `/login` instead (safe, no DB dependency from authorize fallback branch).

---

## Scripts

```bash
npm run dev              # Next dev (Turbopack)
npm run build            # tsc typecheck + next build
npm run start            # Next start (production server)
npm run lint             # next lint
npm run demo:seed        # Seed demo domain data (prisma + DATABASE_URL)
npm run demo:precompute  # Recompute KPIs, statuses, and calendar event views
```

---

## Roadmap (intentional, not implemented)

- Ed25519 session-signed magic links
- Passkey + TOTP 2FA on admin accounts
- Client-portal read-only dashboard share links (limited role)
- S3-compatible document storage for advisory PDFs + brand letterhead uploads
- Multi-workspace / multi-firm / RBAC per-client scopes

---

## Contributing

- `npx tsc --noEmit` must pass before a PR is opened. Strict tsconfig is enforced.
- All pages use global CSS tokens (`m-*` for marketing, app tokens in the rest of `globals.css`) — no ad-hoc inline styles or Tailwind arbitrary classes.
- Private route handlers go in `(dashboard)/api/*`; they inherit the route-group auth gate automatically. Public endpoints like demo-login go in `(marketing)/api/*`.
