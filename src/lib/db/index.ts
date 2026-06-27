import { AuroraDSQLPool } from "@aws/aurora-dsql-node-postgres-connector";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";
import { DsqlSigner } from "@aws-sdk/dsql-signer";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient } from "pg";
import * as schema from "./schema";
import * as relations from "./relations";

const fullSchema = { ...schema, ...relations };

type Db = NodePgDatabase<typeof fullSchema>;

let pool: AuroraDSQLPool | Pool | null = null;
let dbInstance: Db | null = null;

export function isDbConfigured(): boolean {
  return Boolean(process.env.PGHOST && process.env.AWS_REGION);
}

function useOidc(): boolean {
  return Boolean(process.env.AWS_ROLE_ARN && process.env.VERCEL);
}

async function createLocalPool(): Promise<Pool> {
  const signer = new DsqlSigner({
    hostname: process.env.PGHOST!,
    region: process.env.AWS_REGION!,
  });
  const token = await signer.getDbConnectAdminAuthToken();
  return new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER || "admin",
    password: token,
    database: process.env.PGDATABASE || "postgres",
    port: Number(process.env.PGPORT || 5432),
    ssl: true,
    max: 5,
  });
}

function createOidcPool(): AuroraDSQLPool {
  const p = new AuroraDSQLPool({
    host: process.env.PGHOST!,
    region: process.env.AWS_REGION!,
    user: process.env.PGUSER || "admin",
    database: process.env.PGDATABASE || "postgres",
    port: Number(process.env.PGPORT || 5432),
    customCredentialsProvider: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN!,
      clientConfig: { region: process.env.AWS_REGION! },
    }),
  });
  attachDatabasePool(p);
  return p;
}

async function getPool(): Promise<AuroraDSQLPool | Pool> {
  if (pool) return pool;
  if (!isDbConfigured()) {
    throw new Error(
      "Database not configured. Set PGHOST and AWS_REGION environment variables."
    );
  }
  pool = useOidc() ? createOidcPool() : await createLocalPool();
  return pool;
}

export async function getDb(): Promise<Db> {
  if (dbInstance) return dbInstance;
  const p = await getPool();
  dbInstance = drizzle(p, { schema: fullSchema });
  return dbInstance;
}

export async function rawQuery(sql: string, params?: unknown[]) {
  const p = await getPool();
  return p.query(sql, params);
}

export async function withConnection<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const p = await getPool();
  const client = await p.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
