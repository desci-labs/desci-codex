import { Pool } from "pg";
import logger from "../logger.js";

const log = logger.child({ module: "migration" });

export async function runMigrations(): Promise<void> {
  const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "codex_metrics",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

  try {
    const client = await pool.connect();

    log.info("Starting database migration...");

    // Create new simplified node_metrics table with environment separation
    log.info(
      "Creating new simplified node_metrics table with environment support...",
    );
    await client.query(`
      CREATE TABLE IF NOT EXISTS node_metrics (
        time TIMESTAMPTZ NOT NULL,
        ipfs_peer_id TEXT NOT NULL,
        ceramic_peer_id TEXT NOT NULL,
        environment TEXT NOT NULL CHECK (environment IN ('testnet', 'mainnet', 'local')),
        total_streams INTEGER NOT NULL,
        total_pinned_cids INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create indexes for better query performance
    log.info("Creating indexes...");
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_node_metrics_time ON node_metrics (time DESC)",
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_node_metrics_ipfs_peer_id ON node_metrics (ipfs_peer_id, time DESC)",
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_node_metrics_environment ON node_metrics (environment, time DESC)",
    );

    client.release();
    log.info("Database migration completed successfully");
  } catch (error) {
    log.error(error, "Error during database migration");
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      log.info("Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      log.error(error, "Migration failed");
      process.exit(1);
    });
}
