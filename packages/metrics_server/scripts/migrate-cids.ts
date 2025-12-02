#!/usr/bin/env tsx
/**
 * Migration script to update placeholder streamCid and eventCid values with correct CIDs.
 *
 * This script:
 * 1. Finds all streams where streamCid looks like a placeholder
 * 2. Finds all events where eventCid looks like a placeholder
 * 3. Computes correct CIDs using \@ceramic-sdk/identifiers
 * 4. Updates the database with correct values
 *
 * Usage:
 *   pnpm tsx scripts/migrate-cids.ts [--dry-run]
 *
 * Options:
 *   --dry-run    Show what would be updated without making changes
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { StreamID, CommitID } from "@ceramic-sdk/identifiers";
import { streams, events } from "../src/drizzleSchema.js";
import "dotenv/config";

const isDryRun = process.argv.includes("--dry-run");

const notRealCid = (str: string) => !str.startsWith("bagcq");

async function migrateStreamCids(
  pool: Pool,
): Promise<{ checked: number; updated: number; failed: number }> {
  const db = drizzle(pool);

  console.log("\n📊 Migrating stream CIDs...");

  const allStreams = await db.select().from(streams);

  let updated = 0;
  let failed = 0;
  const failedIds: string[] = [];

  for (const stream of allStreams) {
    if (notRealCid(stream.streamCid)) {
      try {
        // Derive the correct CID from streamId
        const streamIdObj = StreamID.fromString(stream.streamId);
        const correctCid = streamIdObj.cid.toString();

        if (correctCid !== stream.streamCid) {
          console.log(`  ${stream.streamId}`);
          console.log(`    Old: ${stream.streamCid}`);
          console.log(`    New: ${correctCid}`);

          if (!isDryRun) {
            await db
              .update(streams)
              .set({ streamCid: correctCid })
              .where(eq(streams.streamId, stream.streamId));
          }

          updated++;
        }
      } catch (error) {
        console.error(
          `  ❌ Failed to process stream ${stream.streamId}:`,
          error instanceof Error ? error.message : error,
        );
        failed++;
        failedIds.push(stream.streamId);
      }
    }
  }

  if (failedIds.length > 0) {
    console.log(`\n⚠️  Failed stream IDs:`);
    failedIds.forEach((id) => console.log(`  - ${id}`));
  }

  return { checked: allStreams.length, updated, failed };
}

async function migrateEventCids(
  pool: Pool,
): Promise<{ checked: number; updated: number; failed: number }> {
  const db = drizzle(pool);

  console.log("\n📊 Migrating event CIDs...");

  const allEvents = await db.select().from(events);

  let updated = 0;
  let failed = 0;
  const failedIds: string[] = [];

  for (const event of allEvents) {
    if (notRealCid(event.eventCid)) {
      try {
        // Derive the correct CID from eventId (which is a CommitID)
        const commitIdObj = CommitID.fromString(event.eventId);
        const correctCid = commitIdObj.commit.toString();

        if (correctCid !== event.eventCid) {
          console.log(`  ${event.eventId}`);
          console.log(`    Old: ${event.eventCid}`);
          console.log(`    New: ${correctCid}`);

          if (!isDryRun) {
            await db
              .update(events)
              .set({ eventCid: correctCid })
              .where(eq(events.eventId, event.eventId));
          }

          updated++;
        }
      } catch (error) {
        console.error(
          `  ❌ Failed to process event ${event.eventId}:`,
          error instanceof Error ? error.message : error,
        );
        failed++;
        failedIds.push(event.eventId);
      }
    }
  }

  if (failedIds.length > 0) {
    console.log(`\n⚠️  Failed event IDs:`);
    failedIds.forEach((id) => console.log(`  - ${id}`));
  }

  return { checked: allEvents.length, updated, failed };
}

async function main() {
  console.log("🔧 CID Migration Script");
  console.log("======================");

  if (isDryRun) {
    console.log("\n🔍 DRY RUN MODE - No changes will be made\n");
  }

  // Create database connection
  const poolConfig = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "codex_metrics",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  };
  console.log("ℹ️ Connecting to database with details:", {
    ...poolConfig,
    password: "[REDACTED]",
  });
  const pool = new Pool(poolConfig);

  try {
    // Test connection
    const client = await pool.connect();
    console.log("✅ Database connection successful");
    client.release();

    // Migrate streams
    const streamStats = await migrateStreamCids(pool);

    // Migrate events
    const eventStats = await migrateEventCids(pool);

    // Print summary
    console.log("\n📈 Migration Summary");
    console.log("===================");
    console.log(`\nStreams:`);
    console.log(`  Checked: ${streamStats.checked}`);
    console.log(
      `  ${isDryRun ? "Would update" : "Updated"}: ${streamStats.updated}`,
    );
    console.log(`  Failed: ${streamStats.failed}`);

    console.log(`\nEvents:`);
    console.log(`  Checked: ${eventStats.checked}`);
    console.log(
      `  ${isDryRun ? "Would update" : "Updated"}: ${eventStats.updated}`,
    );
    console.log(`  Failed: ${eventStats.failed}`);

    const totalUpdated = streamStats.updated + eventStats.updated;
    const totalFailed = streamStats.failed + eventStats.failed;

    console.log(`\nTotal:`);
    console.log(`  ${isDryRun ? "Would update" : "Updated"}: ${totalUpdated}`);
    console.log(`  Failed: ${totalFailed}`);

    if (isDryRun) {
      console.log(`\n💡 Run without --dry-run to apply changes`);
    } else if (totalUpdated > 0) {
      console.log(`\n✅ Migration completed successfully!`);
    } else {
      console.log(`\n✅ No updates needed - all CIDs are already correct!`);
    }

    if (totalFailed > 0) {
      console.log(
        `\n⚠️  Some entries failed to migrate. Please review the errors above.`,
      );
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
