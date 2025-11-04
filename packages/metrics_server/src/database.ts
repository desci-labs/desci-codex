import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { NodeMetricsGranular } from "@desci-labs/desci-codex-metrics";
import {
  nodes,
  manifests,
  streams,
  events,
  nodeManifests,
  nodeStreams,
  nodeEvents,
} from "./drizzleSchema.js";
import logger from "./logger.js";

const log = logger.child({ module: "database" });

export class DatabaseService {
  private pool: Pool;
  private db: NodePgDatabase;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "codex_metrics",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      ssl:
        process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.db = drizzle(this.pool);

    // Handle pool errors
    this.pool.on("error", (err: Error) => {
      log.error(err, "Unexpected error on idle client");
    });
  }

  async dbConnectionIsOk(): Promise<boolean> {
    try {
      await this.db.select().from(nodes).limit(1);
      return true;
    } catch (error) {
      log.error(error, "Database connection check failed");
      return false;
    }
  }

  async writeNodeMetrics(metrics: NodeMetricsGranular): Promise<void> {
    try {
      await this.db.transaction(async (tx) => {
        // Upsert node
        await tx
          .insert(nodes)
          .values({
            nodeId: metrics.nodeId,
            peerId: metrics.peerId,
            firstSeenAt: new Date(metrics.collectedAt),
            lastSeenAt: new Date(metrics.collectedAt),
          })
          .onConflictDoUpdate({
            target: nodes.nodeId,
            set: {
              lastSeenAt: new Date(metrics.collectedAt),
            },
          });

        // Upsert manifests
        for (const manifestCid of metrics.manifests) {
          await tx
            .insert(manifests)
            .values({
              manifestCid: manifestCid,
              firstSeenAt: new Date(metrics.collectedAt),
            })
            .onConflictDoNothing();

          // Link node to manifest
          await tx
            .insert(nodeManifests)
            .values({
              nodeId: metrics.nodeId,
              manifestCid: manifestCid,
              firstSeenAt: new Date(metrics.collectedAt),
            })
            .onConflictDoNothing();
        }

        // Upsert streams and events
        for (const stream of metrics.streams) {
          // Upsert stream
          await tx
            .insert(streams)
            .values({
              streamId: stream.streamId,
              streamCid: stream.streamCid,
              firstSeenAt: new Date(metrics.collectedAt),
            })
            .onConflictDoNothing();

          // Link node to stream
          await tx
            .insert(nodeStreams)
            .values({
              nodeId: metrics.nodeId,
              streamId: stream.streamId,
              firstSeenAt: new Date(metrics.collectedAt),
            })
            .onConflictDoNothing();

          // Upsert events
          for (const eventId of stream.eventIds) {
            // Upsert event
            await tx
              .insert(events)
              .values({
                eventId: eventId,
                streamId: stream.streamId,
                eventCid: `${eventId}-cid`, // Placeholder - actual implementation would have real CID
                firstSeenAt: new Date(metrics.collectedAt),
              })
              .onConflictDoNothing();

            // Link node to event
            await tx
              .insert(nodeEvents)
              .values({
                nodeId: metrics.nodeId,
                eventId: eventId,
                firstSeenAt: new Date(metrics.collectedAt),
              })
              .onConflictDoNothing();
          }
        }
      });

      log.info(
        {
          nodeId: metrics.nodeId,
          peerId: metrics.peerId,
          environment: metrics.environment,
          manifestCount: metrics.manifests.length,
          streamCount: metrics.streams.length,
        },
        "Successfully wrote granular metrics to database",
      );
    } catch (error) {
      log.error(error, "Error writing granular metrics to database");
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
