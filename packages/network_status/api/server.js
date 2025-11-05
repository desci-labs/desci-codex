/* eslint-env node */
import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { Pool } = pg;

const app = express();
const port = process.env.API_PORT || 3004;

// Database connection using environment variables
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "codex_metrics",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  ssl: process.env.DB_SSL === "true",
});

app.use(cors());
app.use(express.json());

// GET /api/stats - Network statistics
app.get("/api/stats", async (req, res) => {
  try {
    const now = new Date();
    const activeThreshold = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago

    // Get basic stats
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM nodes) as total_nodes,
        (SELECT COUNT(*) FROM nodes WHERE last_seen_at >= $1) as active_nodes,
        (SELECT COUNT(*) FROM manifests) as total_manifests,
        (SELECT COUNT(*) FROM streams) as total_streams,
        (SELECT COUNT(*) FROM events) as total_events
    `;
    const statsResult = await pool.query(statsQuery, [activeThreshold]);
    const stats = statsResult.rows[0];

    // Get nodes over time (last 7 days, daily buckets, filled with zeros)
    const nodesOverTimeQuery = `
      WITH date_series AS (
        SELECT generate_series(
          DATE_TRUNC('day', NOW() - INTERVAL '6 days'),
          DATE_TRUNC('day', NOW()),
          INTERVAL '1 day'
        ) AS date
      ),
      node_counts AS (
        SELECT 
          DATE_TRUNC('day', first_seen_at) as date,
          COUNT(*) as count
        FROM nodes
        WHERE first_seen_at >= NOW() - INTERVAL '6 days'
        GROUP BY DATE_TRUNC('day', first_seen_at)
      )
      SELECT 
        ds.date,
        COALESCE(nc.count, 0) as count
      FROM date_series ds
      LEFT JOIN node_counts nc ON ds.date = nc.date
      ORDER BY ds.date ASC
    `;
    const nodesOverTimeResult = await pool.query(nodesOverTimeQuery);

    // Get manifests over time (last 7 days, daily buckets, filled with zeros)
    const manifestsOverTimeQuery = `
      WITH date_series AS (
        SELECT generate_series(
          DATE_TRUNC('day', NOW() - INTERVAL '6 days'),
          DATE_TRUNC('day', NOW()),
          INTERVAL '1 day'
        ) AS date
      ),
      manifest_counts AS (
        SELECT 
          DATE_TRUNC('day', first_seen_at) as date,
          COUNT(*) as count
        FROM manifests
        WHERE first_seen_at >= NOW() - INTERVAL '6 days'
        GROUP BY DATE_TRUNC('day', first_seen_at)
      )
      SELECT 
        ds.date,
        COALESCE(mc.count, 0) as count
      FROM date_series ds
      LEFT JOIN manifest_counts mc ON ds.date = mc.date
      ORDER BY ds.date ASC
    `;
    const manifestsOverTimeResult = await pool.query(manifestsOverTimeQuery);

    res.json({
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
    });
  } catch (error) {
    console.error("Error fetching network stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/nodes - List all nodes
app.get("/api/nodes", async (req, res) => {
  try {
    const query = `
      SELECT node_id, ceramic_peer_id, first_seen_at, last_seen_at
      FROM nodes
      ORDER BY last_seen_at DESC
    `;
    const result = await pool.query(query);

    res.json(
      result.rows.map((row) => ({
        nodeId: row.node_id,
        ceramicPeerId: row.ceramic_peer_id,
        firstSeenAt: row.first_seen_at,
        lastSeenAt: row.last_seen_at,
      })),
    );
  } catch (error) {
    console.error("Error fetching nodes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/nodes/:nodeId - Get node details
app.get("/api/nodes/:nodeId", async (req, res) => {
  try {
    const { nodeId } = req.params;

    // Get node info
    const nodeQuery = `
      SELECT node_id, ceramic_peer_id, first_seen_at, last_seen_at
      FROM nodes
      WHERE node_id = $1
    `;
    const nodeResult = await pool.query(nodeQuery, [nodeId]);

    if (nodeResult.rows.length === 0) {
      return res.status(404).json({ error: "Node not found" });
    }

    const node = nodeResult.rows[0];

    // Get node manifests
    const manifestsQuery = `
      SELECT m.manifest_cid, m.first_seen_at
      FROM node_manifests nm
      JOIN manifests m ON nm.manifest_cid = m.manifest_cid
      WHERE nm.node_id = $1
    `;
    const manifestsResult = await pool.query(manifestsQuery, [nodeId]);

    // Get node streams
    const streamsQuery = `
      SELECT s.stream_id, s.stream_cid, s.first_seen_at
      FROM node_streams ns
      JOIN streams s ON ns.stream_id = s.stream_id
      WHERE ns.node_id = $1
    `;
    const streamsResult = await pool.query(streamsQuery, [nodeId]);

    // Get node events
    const eventsQuery = `
      SELECT e.event_id, e.stream_id, e.event_cid, e.first_seen_at
      FROM node_events ne
      JOIN events e ON ne.event_id = e.event_id
      WHERE ne.node_id = $1
    `;
    const eventsResult = await pool.query(eventsQuery, [nodeId]);

    res.json({
      nodeId: node.node_id,
      ceramicPeerId: node.ceramic_peer_id,
      firstSeenAt: node.first_seen_at,
      lastSeenAt: node.last_seen_at,
      manifests: manifestsResult.rows.map((row) => ({
        manifestCid: row.manifest_cid,
        firstSeenAt: row.first_seen_at,
      })),
      streams: streamsResult.rows.map((row) => ({
        streamId: row.stream_id,
        streamCid: row.stream_cid,
        firstSeenAt: row.first_seen_at,
      })),
      events: eventsResult.rows.map((row) => ({
        eventId: row.event_id,
        streamId: row.stream_id,
        eventCid: row.event_cid,
        firstSeenAt: row.first_seen_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching node detail:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/manifests - List manifests with pagination
app.get("/api/manifests", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit) || 25));
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = "SELECT COUNT(*) as total FROM manifests";
    const countResult = await pool.query(countQuery);
    const total = Number(countResult.rows[0].total);

    // Get paginated results
    const query = `
      SELECT 
        m.manifest_cid,
        m.first_seen_at,
        COUNT(nm.node_id) as node_count
      FROM manifests m
      LEFT JOIN node_manifests nm ON m.manifest_cid = nm.manifest_cid
      GROUP BY m.manifest_cid, m.first_seen_at
      ORDER BY m.first_seen_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: result.rows.map((row) => ({
        manifestCid: row.manifest_cid,
        firstSeenAt: row.first_seen_at,
        nodeCount: Number(row.node_count),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching manifests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/streams/:streamId/events - Get events for a specific stream
app.get("/api/streams/:streamId/events", async (req, res) => {
  try {
    const { streamId } = req.params;

    const query = `
      SELECT event_id, event_cid, first_seen_at
      FROM events
      WHERE stream_id = $1
      ORDER BY first_seen_at DESC
    `;
    const result = await pool.query(query, [streamId]);

    res.json(
      result.rows.map((row) => ({
        eventId: row.event_id,
        eventCid: row.event_cid,
        firstSeenAt: row.first_seen_at,
      })),
    );
  } catch (error) {
    console.error("Error fetching stream events:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/streams - List streams with pagination
app.get("/api/streams", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit) || 25));
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = "SELECT COUNT(*) as total FROM streams";
    const countResult = await pool.query(countQuery);
    const total = Number(countResult.rows[0].total);

    // Get paginated results
    const query = `
      SELECT 
        s.stream_id,
        s.stream_cid,
        s.first_seen_at,
        COUNT(e.event_id) as event_count,
        COUNT(DISTINCT ns.node_id) as node_count
      FROM streams s
      LEFT JOIN events e ON s.stream_id = e.stream_id
      LEFT JOIN node_streams ns ON s.stream_id = ns.stream_id
      GROUP BY s.stream_id, s.stream_cid, s.first_seen_at
      ORDER BY s.first_seen_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: result.rows.map((row) => ({
        streamId: row.stream_id,
        streamCid: row.stream_cid,
        firstSeenAt: row.first_seen_at,
        eventCount: Number(row.event_count),
        nodeCount: Number(row.node_count),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching streams:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  } catch (error) {
    res
      .status(503)
      .json({ status: "unhealthy", error: "Database connection failed" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Network Status API server running at http://localhost:${port}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down API server...");
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down API server...");
  await pool.end();
  process.exit(0);
});
