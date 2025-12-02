import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@/lib/db";

interface HealthStatus {
  status: "healthy" | "unhealthy";
  timestamp: string;
  error?: string;
}

export const getHealthStatus = createServerFn().handler(
  async (): Promise<HealthStatus> => {
    const client = createClient();
    try {
      await client.connect();
      await client.query("SELECT 1");
      return { status: "healthy", timestamp: new Date().toISOString() };
    } catch (error) {
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Database connection failed",
      };
    } finally {
      await client.end();
    }
  },
);
