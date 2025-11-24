# Poneglyph — Executive Dashboard, Accounts, Leads
Internal SDR workspace for Andes STR. Next.js (App Router), TypeScript, Tailwind, Prisma (PostgreSQL).

## Features (rutas principales)
- `/` Executive Dashboard (resumen, métricas, action-required).
- `/accounts` Vista de compañías (portfolio de cuentas + leads activos, filtros, import).
- `/sales` Leads Console (filtros completos, “mark worked”, HubSpot links).
- `/import` + `/import/accounts` + `/import/leads` Formularios de carga CSV/XLSX (API `/api/import`).
- APIs: `GET /api/leads` (con filtros), `POST /api/leads/[id]/work` (actualiza lastTouchDate y estado).

## Variables de entorno
- `DATABASE_URL` (Postgres remoto; Vercel no puede acceder a tu DB local).

## Bash/PowerShell útiles
```bash
# Instalar deps
npm install

# Desarrollo local
npm run dev

# Build producción
npm run build

# Prisma
npx prisma generate          # regenerar cliente
npx prisma db push           # aplicar schema al Postgres configurado

# Scripts de import (CLI)
npx ts-node scripts/import-accounts-from-csv.ts   # usa data/accounts.csv
npx ts-node scripts/import-leads-from-csv.ts      # usa data/leads.csv

# Script de conexión rápida (sin mock data)
npx ts-node scripts/test-db.ts

# Deploy con Vercel CLI (si la tienes configurada)
npx vercel --prod
```

## Notas
- Usa un Postgres accesible desde Vercel; ajusta `DATABASE_URL` en Vercel y en `.env` local.
- `owner=All` en `/api/leads` se interpreta como sin filtro de owner.
- “Mark worked” pone `lastTouchDate = now` y si estaba `PENDING` pasa a `IN_PROGRESS`.
