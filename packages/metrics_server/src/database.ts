import { Pool, type PoolClient } from "pg";
import logger from "./logger.js";

const log = logger.child({ module: "database" });

export interface NodeMetrics {
  ipfsPeerId: string;
  ceramicPeerId: string;
  environment: "testnet" | "mainnet" | "local";
  totalStreams: number;
  totalPinnedCids: number;
  collectedAt: string;
}

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "codex_metrics",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      ssl:
        process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    this.pool.on("error", (err: Error) => {
      log.error(err, "Unexpected error on idle client");
    });
  }

  async initialize(): Promise<void> {
    try {
      const client = await this.pool.connect();

      // Create simplified node_metrics table with environment support
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
      log.info("Database initialized successfully");
    } catch (error) {
      log.error(error, "Error initializing database");
      throw error;
    }
  }

  async dbConnectionIsOk(): Promise<boolean> {
    let client: PoolClient | undefined;
    try {
      client = await this.pool.connect();
      await client.query("SELECT * FROM node_metrics LIMIT 1");
      return true;
    } catch (error) {
      log.error(error, "Database connection check failed");
      return false;
    } finally {
      client?.release();
    }
  }

  async writeNodeMetrics(metrics: NodeMetrics): Promise<void> {
    try {
      const client = await this.pool.connect();

      await client.query(
        `INSERT INTO node_metrics (time, ipfs_peer_id, ceramic_peer_id, environment, total_streams, total_pinned_cids)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          new Date(metrics.collectedAt),
          metrics.ipfsPeerId,
          metrics.ceramicPeerId,
          metrics.environment,
          metrics.totalStreams,
          metrics.totalPinnedCids,
        ],
      );

      client.release();
      log.info(
        { ipfsPeerId: metrics.ipfsPeerId, environment: metrics.environment },
        "Successfully wrote node metrics to database",
      );
    } catch (error) {
      log.error(error, "Error writing node metrics to database");
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
