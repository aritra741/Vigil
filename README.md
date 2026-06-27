# Vigil

Financial Risk Operations Command Center - built with Next.js 15, Aurora DSQL, and Vercel.

## Features

- **Executive Dashboard** — real-time metrics, risk trend charts, severity breakdown
- **Transaction Feed** — paginated feed with simulate burst for live demos
- **Alert Queue** — tabbed investigation queue with severity-coded alerts
- **Alert Detail** — two-column investigation view with OCC-safe status updates
- **Rule Builder** — no-code risk rule creation
- **Audit Log** — complete system of record
- **Reports** — generate audit-ready risk review reports

## Tech Stack

- Next.js 15 (App Router)
- Aurora DSQL + Drizzle ORM
- Vercel OIDC → AWS IAM authentication
- Tailwind CSS 4 + shadcn/ui
- Recharts

## Setup

### 1. Provision Aurora DSQL

Install via [Vercel Marketplace](https://vercel.com/marketplace/aws/aws-dsql) or AWS CLI.

### 2. Configure Environment

```bash
cp .env.example .env.local
# Fill in PGHOST, AWS_REGION, AWS_ROLE_ARN
vercel env pull .env.local  # if using Vercel
```

### 3. Install & Migrate

```bash
npm install
npm run db:migrate
npm run db:seed
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, then enter the dashboard.

## DSQL Design Decisions

- UUID primary keys (no SERIAL)
- No foreign key constraints (application-level integrity)
- TEXT instead of JSONB
- Version columns for optimistic concurrency control
- Idempotency keys on transactions
- `CREATE INDEX ASYNC` for indexes
- Batch inserts (2,500 rows) respecting 3,000 row/txn limit

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:migrate` | Run DSQL-safe migrations |
| `npm run db:seed` | Seed 50K demo transactions |

## Deployment

Deploy to Vercel. Ensure environment variables are set for Production and Preview environments.
