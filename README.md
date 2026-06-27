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

Install via [Vercel Marketplace](https://vercel.com/marketplace/aws/aws-dsql) or AWS CLI:

```bash
aws dsql create-cluster --region us-east-1
aws dsql get-cluster --identifier <cluster-id> --region us-east-1
```

Copy the cluster endpoint into `PGHOST` (format: `<id>.dsql.<region>.on.aws`).

### 2. Configure AWS credentials (local dev)

Local development authenticates with IAM via your machine's AWS credential chain — not Vercel OIDC.

**Install AWS CLI** (if needed):

```bash
brew install awscli
```

**Configure credentials** (pick one):

```bash
# Option A: interactive profile (recommended)
aws configure
# Enter Access Key ID, Secret Access Key, and region (e.g. us-east-1)

# Option B: environment variables
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_REGION=us-east-1

# Option C: named profile — set AWS_PROFILE in .env.local
aws configure --profile vigil
```

Your IAM principal needs `dsql:DbConnectAdmin` on the cluster (admin user) or `dsql:DbConnect` for non-admin users.

Verify credentials:

```bash
aws sts get-caller-identity
```

### 3. Configure environment

```bash
cp .env.example .env.local
# Edit PGHOST and AWS_REGION to match your cluster
```

For Vercel deployments, also set `AWS_ROLE_ARN` and pull env vars:

```bash
vercel env pull .env.local
```

### 4. Install & verify

```bash
npm install
npm run db:check    # test AWS → DSQL connection
npm run db:migrate
npm run db:seed
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, then enter the dashboard.

Without `PGHOST` / `AWS_REGION`, the app falls back to demo data so you can explore the UI without a database.

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
| `npm run db:check` | Verify AWS credentials and DSQL connectivity |
| `npm run db:migrate` | Run DSQL-safe migrations |
| `npm run db:seed` | Seed 50K demo transactions |

## Deployment

Deploy to Vercel. Ensure environment variables are set for Production and Preview environments.
