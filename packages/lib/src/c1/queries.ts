import type { FlightSqlClient } from "@ceramic-sdk/flight-sql-client";
import { tableFromIPC } from "apache-arrow";

export const instantQuery = async <T>(
  client: FlightSqlClient,
  query: string,
): Promise<T[]> => {
  try {
    const result = await client.query(query);
    const table = tableFromIPC(result);
    return table.toArray() as T[];
  } catch (error) {
    throw new Error(
      `Query execution failed: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
};
