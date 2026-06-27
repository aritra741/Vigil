import { loadEnv } from "./load-env";
loadEnv();

import { rawQuery } from "./index";

async function checkConnection() {
  const required = ["PGHOST", "AWS_REGION"] as const;
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `Missing required env vars: ${missing.join(", ")}\n` +
        "Copy .env.example to .env.local and fill in your DSQL cluster details."
    );
    process.exit(1);
  }

  console.log(`Connecting to ${process.env.PGHOST} (${process.env.AWS_REGION})...`);

  const result = await rawQuery("SELECT NOW() AS now, current_user AS user");
  const row = result.rows[0] as { now: Date; user: string };

  console.log("✓ Connected successfully");
  console.log(`  User: ${row.user}`);
  console.log(`  Time: ${row.now}`);
}

checkConnection().catch((err) => {
  console.error("Connection failed:", err.message ?? err);
  console.error(
    "\nLocal dev uses your AWS credential chain (~/.aws/credentials, AWS_PROFILE, or AWS_ACCESS_KEY_ID).\n" +
      "Ensure your IAM user/role has dsql:DbConnectAdmin on the cluster."
  );
  process.exit(1);
});
