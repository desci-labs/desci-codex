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
      // Nodes are considered active if they interacted with manifests, streams, or events
      const nodesOverTimeResult = await client.query(
        `
        WITH date_series AS (
          SELECT generate_series(
            DATE_TRUNC('day', NOW() - INTERVAL '7 days'),
            DATE_TRUNC('day', NOW()),
            INTERVAL '1 day'
          ) AS date
        ),
        daily_activity AS (
          SELECT 
            DATE_TRUNC('day', first_seen_at) as activity_date,
            COUNT(DISTINCT node_id) as active_nodes
          FROM (
            SELECT node_id, first_seen_at FROM node_manifests WHERE environment = $1
            UNION 
            SELECT node_id, first_seen_at FROM node_streams WHERE environment = $1
            UNION 
            SELECT node_id, first_seen_at FROM node_events WHERE environment = $1
          ) activities
          WHERE first_seen_at >= NOW() - INTERVAL '7 days'
          GROUP BY DATE_TRUNC('day', first_seen_at)
        )
        SELECT 
          ds.date,
          COALESCE(da.active_nodes, 0) as count
        FROM date_series ds
        LEFT JOIN daily_activity da ON ds.date = da.activity_date
        ORDER BY ds.date ASC
      `,
        [data.environment],
      );

      // Get manifest activity over time (last 7 days, daily buckets, filled with zeros)
      // Shows how many nodes interacted with manifests each day
      const manifestsOverTimeResult = await client.query(
        `
        WITH date_series AS (
          SELECT generate_series(
            DATE_TRUNC('day', NOW() - INTERVAL '7 days'),
            DATE_TRUNC('day', NOW()),
            INTERVAL '1 day'
          ) AS date
        ),
        daily_manifest_activity AS (
          SELECT 
            DATE_TRUNC('day', first_seen_at) as activity_date,
            COUNT(DISTINCT node_id) as active_nodes
          FROM node_manifests
          WHERE first_seen_at >= NOW() - INTERVAL '7 days' AND environment = $1
          GROUP BY DATE_TRUNC('day', first_seen_at)
        )
        SELECT 
          ds.date,
          COALESCE(dma.active_nodes, 0) as count
        FROM date_series ds
        LEFT JOIN daily_manifest_activity dma ON ds.date = dma.activity_date
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
        manifestsOverTime: manifestsOverTimeResult.rows.map((row) => ({
          date: row.date,
          count: Number(row.count),
        })),
      };
    } finally {
      await client.end();
    }
  });
