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
  nodeActivity,
} from "./drizzleSchema.js";
import { StreamID, CommitID } from "@ceramic-sdk/identifiers";
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

  async writeNodeMetrics(
    metrics: NodeMetricsGranular,
    metadata?: { ip?: string; country?: string; city?: string },
  ): Promise<void> {
    try {
      await this.db.transaction(async (tx) => {
        // Upsert node - only update metadata if it's provided
        const updateFields: {
          lastSeenAt: Date;
          metadata?: { ip?: string; country?: string; city?: string };
        } = {
          lastSeenAt: new Date(metrics.collectedAt),
        };

        // Only update metadata if it's provided (not undefined)
        if (metadata !== undefined) {
          updateFields.metadata = metadata;
        }
        await tx
          .insert(nodes)
          .values({
            nodeId: metrics.nodeId,
            ceramicPeerId: metrics.ceramicPeerId,
            environment: metrics.environment,
            metadata: metadata || null,
            firstSeenAt: new Date(metrics.collectedAt),
            lastSeenAt: new Date(metrics.collectedAt),
          })
          .onConflictDoUpdate({
            target: nodes.nodeId,
            set: updateFields,
          });

        // Upsert manifests
        for (const manifestCid of metrics.manifests) {
          await tx
            .insert(manifests)
            .values({
              manifestCid: manifestCid,
              environment: metrics.environment,
              firstSeenAt: new Date(metrics.collectedAt),
            })
            .onConflictDoNothing();

          // Link node to manifest
          await tx
            .insert(nodeManifests)
            .values({
              nodeId: metrics.nodeId,
              manifestCid: manifestCid,
              environment: metrics.environment,
              firstSeenAt: new Date(metrics.collectedAt),
            })
            .onConflictDoNothing();
        }

        // Upsert streams and events
        for (const stream of metrics.streams) {
          // Derive streamCid from streamId
          const streamCid = StreamID.fromString(stream.streamId).cid.toString();

          // Upsert stream
          await tx
            .insert(streams)
            .values({
              streamId: stream.streamId,
              streamCid: streamCid,
              environment: metrics.environment,
              firstSeenAt: new Date(metrics.collectedAt),
            })
            .onConflictDoNothing();

          // Link node to stream
          await tx
            .insert(nodeStreams)
            .values({
              nodeId: metrics.nodeId,
              streamId: stream.streamId,
              environment: metrics.environment,
              firstSeenAt: new Date(metrics.collectedAt),
            })
            .onConflictDoNothing();

          // Upsert events
          for (const eventId of stream.eventIds) {
            // Derive eventCid from eventId (which is a CommitID)
            const eventCid = CommitID.fromString(eventId).commit.toString();

            // Upsert event
            await tx
              .insert(events)
              .values({
                eventId: eventId,
                streamId: stream.streamId,
                eventCid: eventCid,
                environment: metrics.environment,
                firstSeenAt: new Date(metrics.collectedAt),
              })
              .onConflictDoNothing();

            // Link node to event
            await tx
              .insert(nodeEvents)
              .values({
                nodeId: metrics.nodeId,
                eventId: eventId,
                environment: metrics.environment,
                firstSeenAt: new Date(metrics.collectedAt),
              })
              .onConflictDoNothing();
          }
        }

        // Upsert daily node activity
        const currentDay = new Date(metrics.collectedAt)
          .toISOString()
          .split("T")[0]; // Format: YYYY-MM-DD
        await tx
          .insert(nodeActivity)
          .values({
            nodeId: metrics.nodeId,
            day: currentDay,
            environment: metrics.environment,
          })
          .onConflictDoNothing();
      });

      log.info(
        {
          nodeId: metrics.nodeId,
          ceramicPeerId: metrics.ceramicPeerId,
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
