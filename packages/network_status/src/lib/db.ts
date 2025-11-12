import { Client } from "pg";
import "dotenv/config";

// Cloudflare workers doesn't allow sharing between invocations,
// so we need a new client for every query
export function createClient() {
  return new Client({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "codex_metrics",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    ssl: process.env.DB_SSL === "true",
  });
}
