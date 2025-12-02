import { defineConfig } from "drizzle-kit";
import "dotenv/config";

console.log("Drizzle config variables:", {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "codex_metrics",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  ssl: process.env.DB_SSL === "true" ? "require" : false,
});

export default defineConfig({
  schema: "./src/drizzleSchema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "codex_metrics",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  },
});
