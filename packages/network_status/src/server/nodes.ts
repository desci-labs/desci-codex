import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@/lib/db";

export const getNodes = createServerFn({ method: "GET" })
  .inputValidator((data: { environment: "testnet" | "mainnet" }) => data)
  .handler(async ({ data }) => {
    const client = createClient();
    try {
      await client.connect();

      const result = await client.query(
        "SELECT node_id, ceramic_peer_id, metadata, first_seen_at, last_seen_at FROM nodes WHERE environment = $1 ORDER BY last_seen_at DESC",
        [data.environment],
      );

      return result.rows.map((row) => ({
        nodeId: row.node_id,
        ceramicPeerId: row.ceramic_peer_id,
        // Only send country and city for privacy - no IP or coordinates
        // This depends on the Cloudflare visitor location headers transform being activated on the domain!
        location: row.metadata
          ? {
              country: row.metadata.country || null,
              city: row.metadata.city || null,
            }
          : null,
        firstSeenAt: row.first_seen_at,
        lastSeenAt: row.last_seen_at,
      }));
    } catch (error) {
      console.error("[getNodes] Error:", error);
      throw new Error(
        `Database query failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await client.end();
    }
  });

export const getNodeDetail = createServerFn({ method: "GET" })
  .inputValidator(
    (data: { nodeId: string; environment: "testnet" | "mainnet" }) => data,
  )
  .handler(async ({ data }) => {
    const client = createClient();
    try {
      await client.connect();

      // Get node info
      const nodeResult = await client.query(
        "SELECT node_id, ceramic_peer_id, metadata, first_seen_at, last_seen_at FROM nodes WHERE node_id = $1 AND environment = $2",
        [data.nodeId, data.environment],
      );

      if (nodeResult.rows.length === 0) {
        throw new Error("Node not found");
      }

      const node = nodeResult.rows[0];

      // Get node manifests
      const manifestsResult = await client.query(
        "SELECT m.manifest_cid, m.first_seen_at FROM node_manifests nm JOIN manifests m ON nm.manifest_cid = m.manifest_cid WHERE nm.node_id = $1 AND nm.environment = $2",
        [data.nodeId, data.environment],
      );

      // Get node streams
      const streamsResult = await client.query(
        "SELECT s.stream_id, s.stream_cid, s.first_seen_at FROM node_streams ns JOIN streams s ON ns.stream_id = s.stream_id WHERE ns.node_id = $1 AND ns.environment = $2",
        [data.nodeId, data.environment],
      );

      // Get node events
      const eventsResult = await client.query(
        "SELECT e.event_id, e.stream_id, e.event_cid, e.first_seen_at FROM node_events ne JOIN events e ON ne.event_id = e.event_id WHERE ne.node_id = $1 AND ne.environment = $2",
        [data.nodeId, data.environment],
      );

      return {
        nodeId: node.node_id,
        ceramicPeerId: node.ceramic_peer_id,
        // Only send country and city for privacy
        location: node.metadata
          ? {
              country: node.metadata.country || null,
              city: node.metadata.city || null,
            }
          : null,
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
      };
    } catch (error) {
      console.error("[getNodeDetail] Error:", error);
      throw new Error(
        `Database query failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await client.end();
    }
  });
