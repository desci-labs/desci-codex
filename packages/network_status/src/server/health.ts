import { createServerFn } from "@tanstack/react-start";
import { pool } from "@/lib/db";

interface HealthStatus {
  status: "healthy" | "unhealthy";
  timestamp: string;
  error?: string;
}

export const getHealthStatus = createServerFn().handler(
  async (): Promise<HealthStatus> => {
    try {
      await pool.query("SELECT 1");
      return { status: "healthy", timestamp: new Date().toISOString() };
    } catch (error) {
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Database connection failed",
      };
    }
  },
);
