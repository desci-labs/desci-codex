import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@/lib/db";

export const getNetworkStats = createServerFn({ method: "GET" })
  .inputValidator((data: { environment: "testnet" | "mainnet" }) => data)
  .handler(async ({ data }) => {
    const client = createClient();
    try {
      await client.connect();
      const now = new Date();
      const activeThreshold = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

      // Get basic stats
      const statsResult = await client.query(
        `
        SELECT 
          (SELECT COUNT(*) FROM nodes WHERE environment = $1) as total_nodes,
          (SELECT COUNT(*) FROM nodes WHERE last_seen_at >= $2 AND environment = $1) as active_nodes,
          (SELECT COUNT(*) FROM manifests WHERE environment = $1) as total_manifests,
          (SELECT COUNT(*) FROM streams WHERE environment = $1) as total_streams,
          (SELECT COUNT(*) FROM events WHERE environment = $1) as total_events
      `,
        [data.environment, activeThreshold],
      );
      const stats = statsResult.rows[0];

      // Get active nodes over time (last 7 days, daily buckets, filled with zeros)
      // Uses the node_activity table which tracks daily node activity efficiently
      const nodesOverTimeResult = await client.query(
        `
        WITH date_series AS (
          SELECT generate_series(
            DATE_TRUNC('day', NOW() - INTERVAL '7 days'),
            DATE_TRUNC('day', NOW()),
            INTERVAL '1 day'
          )::date AS date
        )
        SELECT 
          ds.date,
          COALESCE(COUNT(na.node_id), 0) as count
        FROM date_series ds
        LEFT JOIN node_activity na ON ds.date = na.day AND na.environment = $1
        GROUP BY ds.date
        ORDER BY ds.date ASC
      `,
        [data.environment],
      );

      // Get discovery activity over time (last 7 days, daily buckets, filled with zeros)
      // Shows how many new events and streams were discovered each day
      const discoveryOverTimeResult = await client.query(
        `
        WITH date_series AS (
          SELECT generate_series(
            DATE_TRUNC('day', NOW() - INTERVAL '7 days'),
            DATE_TRUNC('day', NOW()),
            INTERVAL '1 day'
          ) AS date
        ),
        daily_event_discovery AS (
          SELECT 
            DATE_TRUNC('day', first_seen_at) as discovery_date,
            COUNT(*) as new_events
          FROM events
          WHERE first_seen_at >= NOW() - INTERVAL '7 days' AND environment = $1
          GROUP BY DATE_TRUNC('day', first_seen_at)
        ),
        daily_stream_discovery AS (
          SELECT 
            DATE_TRUNC('day', first_seen_at) as discovery_date,
            COUNT(*) as new_streams
          FROM streams
          WHERE first_seen_at >= NOW() - INTERVAL '7 days' AND environment = $1
          GROUP BY DATE_TRUNC('day', first_seen_at)
        )
        SELECT 
          ds.date,
          COALESCE(ded.new_events, 0) as events,
          COALESCE(dsd.new_streams, 0) as streams
        FROM date_series ds
        LEFT JOIN daily_event_discovery ded ON ds.date = ded.discovery_date
        LEFT JOIN daily_stream_discovery dsd ON ds.date = dsd.discovery_date
        ORDER BY ds.date ASC
      `,
        [data.environment],
      );

      return {
        totalNodes: Number(stats.total_nodes),
        activeNodes: Number(stats.active_nodes),
        totalManifests: Number(stats.total_manifests),
        totalStreams: Number(stats.total_streams),
        totalEvents: Number(stats.total_events),
        nodesOverTime: nodesOverTimeResult.rows.map((row) => ({
          date: row.date,
          count: Number(row.count),
        })),
        discoveryOverTime: discoveryOverTimeResult.rows.map((row) => ({
          date: row.date,
          events: Number(row.events),
          streams: Number(row.streams),
        })),
      };
    } finally {
      await client.end();
    }
  });
