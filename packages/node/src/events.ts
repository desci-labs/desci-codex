import {
  FlightSqlClient,
  createFlightSqlClient,
} from "@ceramic-sdk/flight-sql-client";
import { tableFromIPC } from "apache-arrow";
import logger from "./logger.js";
import { sleep } from "./util.js";
import { queueManifest } from "./queue.js";

const log = logger.child({ module: "ceramic-events" });

export interface CeramicEventsService {
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export interface CeramicEventsConfig {
  rpcUrl: string;
  flightUrl: string;
  modelId: string;
}

export function createCeramicEventsService(
  config: CeramicEventsConfig,
): CeramicEventsService {
  let client: FlightSqlClient | null = null;
  let isRunning = false;

  async function streamEvents(): Promise<void> {
    if (!client || !isRunning) {
      log.error({ client, isRunning }, "Events service not ready");
      return;
    }

    let lastEventStateOrder = 0;
    let firstEventStateOrder;
    try {
      while (isRunning) {
        const result = await client.query(
          `
            select event_state_order,data::varchar->'content'->>'manifest' as manifest
            from event_states -- _feed
            where stream_id_string(arrow_cast(dimension_extract(dimensions, 'model'),'Binary')) = '${config.modelId}'
              and event_state_order > ${lastEventStateOrder}
            -- order by event_state_order asc
            limit 1
          `,
        );

        const table = tableFromIPC(result);
        logger.info(
          { length: table.numRows, cols: table.numCols },
          "Received query response",
        );

        if (table.numRows === 0) {
          log.info(
            { processed: lastEventStateOrder - firstEventStateOrder },
            "No more events, snoozing...",
          );
          await sleep(5_000);
          continue;
        }

        for (const record of table.toArray()) {
          log.info({ record }, "Received event");
          if (!firstEventStateOrder) {
            firstEventStateOrder = record.event_state_order;
          }
          lastEventStateOrder = record.event_state_order;

          if (record.manifest) {
            queueManifest(record.manifest);
          }
        }

        // Small delay between queries to aid while testing
        await new Promise((resolve) => setTimeout(resolve, 2_500));
      }
    } catch (error) {
      log.error(error, "Error streaming events");
      throw error;
    }
  }

  return {
    async start() {
      if (isRunning) {
        log.warn("Events service is already running");
        return;
      }

      try {
        log.info(
          { flightUrl: config.flightUrl },
          "Starting Ceramic events service",
        );
        const url = new URL(config.flightUrl);

        client = await createFlightSqlClient({
          host: url.hostname,
          port: parseInt(url.port),
          tls: url.protocol === "https:",
          headers: [],
        });

        isRunning = true;

        await streamEvents();
      } catch (error) {
        log.error(error, "Error starting events service");
        throw error;
      }
    },

    async stop() {
      if (!isRunning) {
        log.warn("Events service is not running");
        return;
      }

      try {
        log.info("Stopping Ceramic events service");
        isRunning = false;
      } catch (error) {
        log.error(error, "Error stopping events service");
        throw error;
      }
    },
  };
}
