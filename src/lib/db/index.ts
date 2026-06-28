import { AuroraDSQLPool } from "@aws/aurora-dsql-node-postgres-connector";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { type PoolClient } from "pg";
import * as schema from "./schema";
import * as relations from "./relations";
import { recordQueryMetric } from "./telemetry";

const fullSchema = { ...schema, ...relations };

type Db = NodePgDatabase<typeof fullSchema>;

let pool: AuroraDSQLPool | null = null;
let dbInstance: Db | null = null;

export function isDbConfigured(): boolean {
  return Boolean(process.env.PGHOST && process.env.AWS_REGION);
}

function useOidc(): boolean {
  return Boolean(process.env.AWS_ROLE_ARN && process.env.VERCEL);
}

function createLocalPool(): AuroraDSQLPool {
  return new AuroraDSQLPool({
    host: process.env.PGHOST!,
    region: process.env.AWS_REGION!,
    user: process.env.PGUSER || "admin",
    database: process.env.PGDATABASE || "postgres",
    port: Number(process.env.PGPORT || 5432),
    ...(process.env.AWS_PROFILE ? { profile: process.env.AWS_PROFILE } : {}),
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

function wrapClient(client: any) {
  if (!client || client.__wrapped) return;
  client.__wrapped = true;

  const originalClientQuery = client.query;
  client.query = async function (this: any, ...cArgs: any[]) {
    const start = performance.now();
    try {
      return await (originalClientQuery as any).apply(this, cArgs);
    } finally {
      const duration = performance.now() - start;
      const queryText = typeof cArgs[0] === "string" ? cArgs[0] : cArgs[0]?.text || "Unknown Query";
      recordQueryMetric(queryText, duration);
    }
  } as any;
}

function wrapPool(p: AuroraDSQLPool): AuroraDSQLPool {
  const originalQuery = p.query;
  p.query = async function (this: any, ...args: any[]) {
    const start = performance.now();
    try {
      return await (originalQuery as any).apply(this, args);
    } finally {
      const duration = performance.now() - start;
      const queryText = typeof args[0] === "string" ? args[0] : args[0]?.text || "Unknown Query";
      recordQueryMetric(queryText, duration);
    }
  } as any;

  const originalConnect = p.connect;
  p.connect = function (this: any, ...args: any[]) {
    const callback = args[0];
    if (typeof callback === "function") {
      args[0] = function (err: any, client: any, release: any) {
        wrapClient(client);
        return callback(err, client, release);
      };
      return (originalConnect as any).apply(this, args);
    }

    return (originalConnect as any).apply(this, args).then((client: any) => {
      wrapClient(client);
      return client;
    });
  } as any;

  return p;
}

async function getPool(): Promise<AuroraDSQLPool> {
  if (pool) return pool;
  if (!isDbConfigured()) {
    throw new Error(
      "Database not configured. Set PGHOST and AWS_REGION in .env.local."
    );
  }
  const rawPool = useOidc() ? createOidcPool() : createLocalPool();
  pool = wrapPool(rawPool);
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
