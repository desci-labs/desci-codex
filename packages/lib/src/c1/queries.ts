import type { FlightSqlClient } from "@ceramic-sdk/flight-sql-client";
import { tableFromIPC } from "apache-arrow";

export const instantQuery = async <T>(
  client: FlightSqlClient,
  query: string,
): Promise<T[]> => {
  const result = await client.query(query);
  const table = tableFromIPC(result);
  return table.toArray();
};
