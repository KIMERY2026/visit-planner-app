# Visit Planner

A real, deployable web app for planning and tracking constituency/office visits:
a places catalogue, a weekly planner that auto-recommends who to visit next, a
dashboard of visit frequency and gaps, and a full visit history — with
role-based logins for MP / Assistant / Staff.

## Tech stack

- **Next.js 14** (App Router, TypeScript) — frontend + API routes in one app
- **PostgreSQL** via **Prisma ORM** — the data layer
- **NextAuth.js** (credentials login, JWT sessions) — authentication
- **Tailwind CSS** — styling
- Deploys cleanly to **Vercel**, with the database hosted on **Neon**, **Vercel
  Postgres**, or **Supabase** (any standard Postgres works)

## Folder structure

```
visit-planner/
├── prisma/
│   ├── schema.prisma       # Place, Visit, WeekPlan, PlanItem, User, roles
│   └── seed.ts             # example places/visits + 3 demo logins
├── src/
│   ├── app/
│   │   ├── login/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── places/[id]/route.ts        # GET/POST/PATCH/DELETE places
│   │   │   ├── visits/[id]/route.ts        # GET/POST/DELETE visits
│   │   │   └── plans/[weekStart]/
│   │   │       ├── route.ts                # get-or-create a week's plan
│   │   │       ├── autofill/route.ts       # the recommendation engine
│   │   │       └── items/[itemId]/route.ts # log/skip/undo/remove one item
│   │   └── (app)/                          # authenticated pages, behind middleware.ts
│   │       ├── dashboard/page.tsx
│   │       ├── plan/page.tsx
│   │       ├── places/page.tsx
│   │       └── history/page.tsx
│   ├── components/
│   │   ├── nav/        (NavRail, SignOutButton)
│   │   ├── plan/        PlanBoard.tsx       # the week board + auto-fill UI
│   │   ├── places/      PlacesManager.tsx, PlaceForm.tsx
│   │   ├── history/     HistoryManager.tsx
│   │   └── ui/          StatCard.tsx, Pill.tsx
│   ├── lib/
│   │   ├── prisma.ts     # Prisma client singleton
│   │   ├── auth.ts       # NextAuth config
│   │   ├── permissions.ts# role → what they can do
│   │   ├── scoring.ts    # the recommendation algorithm
│   │   └── dates.ts
│   └── types/
├── middleware.ts          # protects every page except /login
└── .env.example
```

## How the recommendation engine works (`src/lib/scoring.ts`)

For every place:

```
urgency = daysSinceLastVisit / targetIntervalDays      (never visited → a flat high urgency)
score   = urgency * priorityWeight                      (HIGH 1.4, MEDIUM 1.0, LOW 0.75)
```

"Plan my week" sorts every place by `score` descending and fills Mon–Fri with
the top N, round-robin across the five days. You can also drag in any place by
hand, skip a day, or undo a logged visit (which deletes the visit record too).

## Roles (from the original proposal's access tiers)

| Role | Can do |
|---|---|
| **MP** | Everything, including deleting places and visit records |
| **ASSISTANT** | Add/edit places, run the planner, log/skip/undo visits — cannot delete places or history |
| **STAFF** | View dashboard/places/history, log a visit — read-only on the catalogue |

Edit `src/lib/permissions.ts` to change what each tier can do.

## Local setup

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL (any Postgres) and NEXTAUTH_SECRET
npm run db:push             # create tables
npm run db:seed             # 3 demo logins + example places/visits
npm run dev                 # http://localhost:3000
```

Demo logins (password `password123` for all three):
- `mp@example.org` — full access
- `assistant@example.org` — catalogue + planner, no deletes
- `staff@example.org` — view + log visits only

Generate a real `NEXTAUTH_SECRET` with `openssl rand -base64 32`.

## Deploying (Vercel + Neon, free tier works)

1. **Database**: create a free Postgres project at [neon.tech](https://neon.tech)
   (or Vercel Postgres / Supabase) and copy its connection string.
2. Push this folder to a GitHub repo.
3. Import the repo in [vercel.com/new](https://vercel.com/new).
4. In the Vercel project's Environment Variables, set:
   - `DATABASE_URL` → your Postgres connection string
   - `NEXTAUTH_SECRET` → a random 32-byte secret
   - `NEXTAUTH_URL` → your deployed URL (e.g. `https://visit-planner.vercel.app`)
5. Deploy. Then run the schema push and seed once against the production
   database (locally, with `.env` pointed at the production `DATABASE_URL`):
   ```bash
   npm run db:push
   npm run db:seed
   ```
6. **Change the demo passwords** (or delete the demo users and create real
   ones) before sharing the link with your office.

## Adding real places

Either use the "+ Add a place" form in the app, or bulk-import by writing
rows into `prisma/seed.ts` (or a one-off script) and running it — useful if
you're migrating from a spreadsheet of wards/villages/institutions.

## What's deliberately not built yet

Matching the proposal's phased rollout: no map view, no calendar-app sync, no
offline/mobile app, no automated daily briefing email. The core loop —
catalogue → calendar → history → analysis → recommendation — is complete and
working; those are Phase 2/3 additions once this is in daily use.
