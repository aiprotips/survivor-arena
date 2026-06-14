# Survivor Arena

Prima versione della homepage statica di Survivor Arena.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- Static export pronto per Cloudflare Pages

## Comandi

```bash
npm install
npm run dev
npm run build
```

Cloudflare Pages:

- Build command: `npm run build`
- Output directory: `out`
- Local Pages preview with D1: `npm run cloudflare:dev`

## Cloudflare D1

Il progetto usa il database D1 esistente `survivor-arena-db` tramite binding `DB`.

- Database ID: `d94469cd-d5ee-4135-8aca-d5eb0d2195f4`
- Health endpoint Pages Function: `/api/d1-health`
- Auth migrations: `npm run db:migrate`
- Local auth migrations: `npm run db:migrate:local`
- Remote D1 ping: `npm run db:ping`
- Local D1 ping: `npm run db:ping:local`

## Design system

Il sistema grafico e i design token sono centralizzati in:

- `app/globals.css`
- `tailwind.config.ts`
- `src/components/ui`

Colori, font, spacing, radius, ombre, glow, bottoni e card sono gestiti tramite token e classi riutilizzabili.
