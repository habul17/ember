# Ember

Plan your way through a video course day by day, tick rows off, and keep the
streak alive.

Built for courses that are still being released — a live bootcamp cohort, a DSA
sheet that grows each week — where nobody can tell you up front how many videos
there will be. So Ember never asks. It measures progress against the rows *you*
have entered, and the number moves as you plan.

## Features

- **Plan ahead, not after the fact.** Give a row a date before you watch it. The
  list is your schedule, not a log of what already happened.
- **A row is `date · topic · checkbox`.** Flat list, no nesting, no sections.
  Several rows can share a day; a two-hour video split over four sittings is
  four identical rows.
- **Progress is `done ÷ rows entered`.** There is no guess at the course's real
  size, so the figure is always one you control — plan ten more days and 15/30
  becomes 15/40. Toggle between `50%` and `15 / 30` by tapping it.
- **Moving a row asks what to do with the rest.** Either that row moves alone,
  or every *unfinished* row dated after it is re-laid onto consecutive days.
  Rows still on the original day stay put, and completed rows never move.
- **Streaks and heatmaps run off when you actually ticked the box**, never the
  date written on the row — so rescheduling cannot rewrite your history.
- **Nothing is hidden.** The full history stays on screen above today's rows,
  with a floating *Today* button to jump back down.
- **Bulk entry.** Paste a list of titles, one per line, and pick how many days
  each should span.
- **Undo on every destructive action** — unchecking everything, clearing a
  course, deleting rows.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Prisma ·
Postgres · Auth.js · Vitest · Vercel

## Getting started

Requires Node 20+ and pnpm.

```bash
pnpm install
```

Start a local Postgres and leave it running:

```bash
pnpm prisma dev --name ember
```

Copy `.env.example` to `.env`, paste in the `DATABASE_URL` and
`SHADOW_DATABASE_URL` that command prints, and generate a secret:

```bash
cp .env.example .env
openssl rand -base64 32   # -> AUTH_SECRET
```

Set `DEV_LOGIN="true"` to get a one-click local sign-in, so you can use the app
before any OAuth app exists. Then create the tables and start the dev server:

```bash
pnpm prisma migrate dev
pnpm dev
```

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server on <http://localhost:3000> |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm test` | Unit tests |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |

## Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string |
| `SHADOW_DATABASE_URL` | local only | Used by `prisma migrate dev` |
| `AUTH_SECRET` | yes | `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | yes | `"true"` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | for Google sign-in | |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | for GitHub sign-in | |
| `DEV_LOGIN` | no | Local only. **Never set in production.** |

## Deploying

**Database.** Create a project at [Neon](https://neon.tech), copy the pooled
connection string into `DATABASE_URL`, and apply the schema:

```bash
pnpm prisma migrate deploy
```

**Google sign-in.** In the [Cloud Console](https://console.cloud.google.com),
configure the OAuth consent screen, then create an OAuth client ID of type *Web
application* with these redirect URIs:

```
http://localhost:3000/api/auth/callback/google
https://<your-domain>/api/auth/callback/google
```

**GitHub sign-in.** Register an OAuth app at
<https://github.com/settings/developers> with the callback URL
`https://<your-domain>/api/auth/callback/github`. GitHub allows one callback per
app, so register a second app for `http://localhost:3000` if you want it locally.

**Hosting.** Import the repository on [Vercel](https://vercel.com), add every
variable from the table above — leaving `DEV_LOGIN` unset — and pick a region
close to your database. After the first deploy, add the live domain to both
OAuth apps' callback URLs.

## Data model

`User` owns `Course`s, and a `Course` owns `Item`s — one row on the list each.
The rest of the tables (`Account`, `Session`, `VerificationToken`) belong to
Auth.js.
Days are stored as Postgres `DATE` and handled in code as `YYYY-MM-DD` keys, so
a row planned for the 22nd cannot drift to the 21st across timezones.
Completions store a real timestamp, which is what the streaks and heatmaps read.
