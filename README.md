# Poneglyph – Sales Console & Executive Dashboard

Internal SDR workspace for Andes STR built with Next.js (App Router), TypeScript, Prisma, and Tailwind. It provides a Sales Console for day‑to‑day lead work and an Executive Dashboard for leadership visibility.

## Features
- Sales Console (`/sales`): filters by owner, player type, route, status, market, search; inline “mark worked” and HubSpot link actions.
- Executive Dashboard (`/dashboard`): priority queue view with quick actions.
- API endpoints:
  - `GET /api/leads`: filtered leads.
  - `POST /api/leads/[id]/work`: mark a lead as worked (updates status and last touch).
- Prisma models for AccountList, Account, Lead; PlayerType includes `PROPERTY_MANAGEMENT`.
- CSV import scripts for accounts and leads (upsert by domain/name and account/email).

## Tech Stack
- Next.js 16 (App Router), TypeScript, React 18
- Prisma ORM (PostgreSQL)
- Tailwind CSS

## Development
```bash
npm install
npm run dev        # start dev server
npm run build      # production build
```

### Database
Set `DATABASE_URL` in `.env` for Postgres. Generate client after schema changes:
```bash
npx prisma generate
```

### Useful Scripts
- `scripts/test-db.ts`: quick Prisma connectivity check (creates AccountList + Account).
- `scripts/import-from-csv.ts`: import accounts from `data/accounts.csv`.
- `scripts/import-leads-from-csv.ts`: import leads from `data/leads.csv`.

## Paths
- Main console: `app/page.tsx`
- Sales console: `app/sales/page.tsx`
- Executive dashboard: `app/dashboard/page.tsx`
- Leads API: `app/api/leads/route.ts`, `app/api/leads/[id]/work/route.ts`
- Prisma schema: `prisma/schema.prisma`

## Notes
- Owner query param `owner=All` is treated as no owner filter.
- “Mark worked” sets `lastTouchDate` to now and moves `PENDING` → `IN_PROGRESS`.
