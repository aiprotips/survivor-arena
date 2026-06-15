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

## Telegram bot

Il bot Telegram ufficiale viene usato per:

- verifica account al primo login
- recupero password

Il token del bot non deve mai essere scritto nel repository. Configurarlo come secret Cloudflare:

```bash
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_WEBHOOK_SECRET
```

Variabili non segrete configurate in `wrangler.toml`:

- `TELEGRAM_BOT_USERNAME=SurvivorArena_bot`
- `PUBLIC_SITE_URL=https://survivor-arena.pages.dev`

Webhook Telegram da configurare dopo il deploy:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://survivor-arena.pages.dev/api/telegram/webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

Nota: un bot Telegram può scrivere a un utente solo dopo che l'utente ha avviato il bot. La registrazione crea l'account senza OTP; al primo login l'utente viene guidato alla verifica Telegram.

Per i test locali senza inviare messaggi reali:

```bash
TELEGRAM_TEST_MODE=1 TELEGRAM_DEBUG_CODES=1 npm run cloudflare:dev
```

## Design system

Il sistema grafico e i design token sono centralizzati in:

- `app/globals.css`
- `tailwind.config.ts`
- `src/components/ui`

Colori, font, spacing, radius, ombre, glow, bottoni e card sono gestiti tramite token e classi riutilizzabili.
