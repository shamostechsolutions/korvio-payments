# Korvio

WhatsApp-first contribution, pledge and accountability platform.

> Your group talks on WhatsApp. Korvio handles the contributions.

## What this MVP includes

- Admin registration / login
- Campaign creation with codes, public links, WhatsApp deep links and QR codes
- Contributor import and management
- Pledges and partial payments
- Mock automatic payments + webhook completion
- Manual payment recording
- Private amounts / public names + statuses
- WhatsApp conversation engine (`JOIN CODE`, menus, pledges, balances, admin commands)
- Private reminders (with confirmation)
- Group update generator
- Expenses, budget snapshot, roles/permissions, audit log
- CSV / Excel / JSON reports
- Public campaign progress page

## Stack

- Next.js 16 (App Router)
- PostgreSQL + Prisma
- WhatsApp Cloud API compatible webhooks (mock-friendly locally)
- Pluggable payment provider interface (ships with `mock`)

## Quick start

### 1. Start Postgres

```bash
docker compose up -d
```

Postgres is exposed on port `5434` by default (to avoid clashing with other local Postgres services).

### 2. Install and migrate

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
```

### 3. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo login

- Email: `moses@korvio.app`
- Password: `korvio123`
- Campaign code: `MSW-2026`

## Local WhatsApp testing

Without Meta credentials, Korvio logs outbound WhatsApp messages to the server console.

Simulate an inbound message:

```bash
curl -X POST http://localhost:3000/api/webhooks/whatsapp \
  -H 'Content-Type: application/json' \
  -d '{"from":"256700000202","text":"JOIN MSW-2026"}'
```

Then continue the flow:

```bash
curl -X POST http://localhost:3000/api/webhooks/whatsapp \
  -H 'Content-Type: application/json' \
  -d '{"from":"256700000202","text":"1"}'
```

## Mock payment completion

After a payment is initiated, complete it with:

```bash
curl -X POST http://localhost:3000/api/webhooks/payments \
  -H 'Content-Type: application/json' \
  -H 'x-korvio-signature: korvio-payment-webhook-secret' \
  -d '{
    "eventId":"evt-1",
    "providerReference":"MOCK-XXXX",
    "status":"SUCCESSFUL",
    "providerFee":0
  }'
```

Or set `MOCK_AUTO_COMPLETE=true` in `.env` to auto-complete mock payments.

## Environment

Copy `.env.example` to `.env` and set:

- `DATABASE_URL`
- `AUTH_SECRET`
- `WHATSAPP_*` for Cloud API
- `PAYMENT_PROVIDER=mock` for local development

## Product principle

The WhatsApp group stays the conversation channel.

Sensitive amounts stay private to:

- the contributor
- campaign owners
- authorised treasurers / financial admins
- auditors when permitted
