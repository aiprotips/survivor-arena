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

## Design system

Il sistema grafico e i design token sono centralizzati in:

- `app/globals.css`
- `tailwind.config.ts`
- `src/components/ui`

Colori, font, spacing, radius, ombre, glow, bottoni e card sono gestiti tramite token e classi riutilizzabili.
