import { createFlightSqlClient } from "@ceramic-sdk/flight-sql-client";

export const DEFAULT_LOCAL_FLIGHT = "http://localhost:5102";

export const newFlightSqlClient = (flightUrl: string) => {
  const url = new URL(flightUrl);

  return createFlightSqlClient({
    host: url.hostname,
    port: parseInt(url.port),
    tls: url.protocol === "https:",
    headers: [],
  });
};
