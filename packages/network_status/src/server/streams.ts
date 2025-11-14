import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@/lib/db";

interface GetStreamsInput {
  page?: number;
  limit?: number;
  environment: "testnet" | "mainnet";
}

export const getStreams = createServerFn({ method: "GET" })
  .inputValidator((data: GetStreamsInput) => data)
  .handler(async ({ data }) => {
    const client = createClient();
    try {
      await client.connect();
      const input = {
        page: Math.max(1, data?.page || 1),
        limit: Math.min(100, Math.max(10, data?.limit || 25)),
      };
      const { page = 1, limit = 25 } = input;
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await client.query(
        "SELECT COUNT(*) as total FROM streams WHERE environment = $1",
        [data.environment],
      );
      const total = Number(countResult.rows[0].total);

      // Get paginated results
      const result = await client.query(
        `
        SELECT 
          s.stream_id,
          s.stream_cid,
          s.first_seen_at,
          COUNT(DISTINCT e.event_id) as event_count,
          COUNT(DISTINCT ns.node_id) as node_count
        FROM streams s
        LEFT JOIN events e ON s.stream_id = e.stream_id AND e.environment = $1
        LEFT JOIN node_streams ns ON s.stream_id = ns.stream_id AND ns.environment = $1
        WHERE s.environment = $1
        GROUP BY s.stream_id, s.stream_cid, s.first_seen_at
        ORDER BY s.first_seen_at DESC
        LIMIT $2 OFFSET $3
      `,
        [data.environment, limit, offset],
      );

      const totalPages = Math.ceil(total / limit);

      return {
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
      };
    } finally {
      await client.end();
    }
  });

export const getStreamEvents = createServerFn({ method: "GET" })
  .inputValidator(
    (data: { streamId: string; environment: "testnet" | "mainnet" }) => data,
  )
  .handler(async ({ data }) => {
    const client = createClient();
    try {
      await client.connect();
      const result = await client.query(
        "SELECT event_id, event_cid, first_seen_at FROM events WHERE stream_id = $1 AND environment = $2 ORDER BY first_seen_at DESC",
        [data.streamId, data.environment],
      );

      return result.rows.map((row) => ({
        eventId: row.event_id,
        eventCid: row.event_cid,
        firstSeenAt: row.first_seen_at,
      }));
    } finally {
      await client.end();
    }
  });
