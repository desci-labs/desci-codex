import {
  FlightSqlClient,
  createFlightSqlClient,
} from "@ceramic-sdk/flight-sql-client";
import { tableFromIPC } from "apache-arrow";
import logger from "./logger.js";
import { sleep } from "./util.js";
import { queueManifest } from "./queue.js";
import { listResearchObjectsWithHistory } from "@desci-labs/desci-codex-lib/c1/explore";
import type { ResearchObjectHistory } from "@desci-labs/desci-codex-lib";

const log = logger.child({ module: "ceramic-events" });

export interface CeramicNodeStats {
  peerId: string;
  streams: {
    id: string;
    versions: string[];
  }[];
}

export interface CeramicEventsService {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  stats: () => Promise<CeramicNodeStats>;
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
      throw new Error("Events service not ready");
    }

    try {
      const feed = await client.feedQuery(
        `
          select event_state_order,data::varchar->'content'->>'manifest' as manifest
          from event_states_feed
          where stream_id_string(arrow_cast(dimension_extract(dimensions, 'model'),'Binary')) = '${config.modelId}'
        `,
      );

      while (isRunning) {
        log.info("Waiting for new feed data...");
        const next = await feed.next();

        if (next === null) {
          // This is probably the permanent end of the feed, i.e. a limit in the query was reached
          log.info("No more events in feed, snoozing...");
          await sleep(5_000);
          continue;
        }

        const table = tableFromIPC(next);
        log.info(
          { size: next?.byteLength, numRows: table.numRows },
          "got data from feed",
        );

        for (const record of table.toArray()) {
          if (record.manifest) {
            queueManifest(record.manifest);
          } else {
            log.warn("Received event with no manifest", { record });
          }
        }
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

    async stats() {
      if (!client || !isRunning) {
        log.error({ client, isRunning }, "Events service not ready");
        throw new Error("Events service not ready");
      }

      const peerId = await fetch(config.rpcUrl + "/api/v0/id", {
        method: "POST",
      });
      if (!peerId.ok) {
        log.error({ peerId }, "Error getting peerId from Ceramic node");
        throw new Error("Error getting peerId from Ceramic node");
      }

      const peerIdJson = (await peerId.json()) as { ID: string };

      const fullState = await listResearchObjectsWithHistory(client);
      const knownStreams = fullState.map((ro: ResearchObjectHistory) => ({
        id: ro.id,
        versions: ro.versions.map(
          (v: ResearchObjectHistory["versions"][number]) => v.version,
        ),
      }));

      return {
        peerId: peerIdJson.ID,
        streams: knownStreams,
      };
    },
  };
}
