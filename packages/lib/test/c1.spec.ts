import { test, describe, beforeAll } from "vitest";
import { FlightSqlClient } from "@ceramic-sdk/flight-sql-client";
import { newFlightSqlClient, DEFAULT_LOCAL_FLIGHT } from "../src/c1/clients.js";
import { listResearchObjects } from "../src/c1/explore.js";

describe("C1 module", async () => {
  let client: FlightSqlClient;

  beforeAll(async () => {
    try {
      client = await newFlightSqlClient(DEFAULT_LOCAL_FLIGHT);
    } catch (error) {
      console.error(error);
      console.error(
        "Failed to connect to ceramic-one, run `docker compose -f docker/compose.yaml up ceramic`",
      );
      process.exit(1);
    }
  });

  test("should fetch research objects", async () => {
    const result = await listResearchObjects(client);
    console.log(JSON.stringify(result, undefined, 2));
  });
});
