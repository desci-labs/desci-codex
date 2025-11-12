import { Client } from "pg";
import "dotenv/config";
import { env } from "cloudflare:workers";

// Cloudflare workers doesn't allow sharing between invocations,
// so we need a new client for every query
export function createClient() {
  return new Client({
    connectionString: env.HYPERDRIVE.connectionString,
  });
}
