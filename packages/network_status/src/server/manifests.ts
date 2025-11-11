import { createServerFn } from "@tanstack/react-start";
import { pool } from "@/lib/db";

interface GetManifestsInput {
  page?: number;
  limit?: number;
  environment: "testnet" | "mainnet";
}

export const getManifests = createServerFn({ method: "GET" })
  .inputValidator((data: GetManifestsInput) => data)
  .handler(async ({ data }) => {
      const input = {
        page: Math.max(1, data?.page || 1),
        limit: Math.min(100, Math.max(10, data?.limit || 25)),
      };
      const { page = 1, limit = 25 } = input;
      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = "SELECT COUNT(*) as total FROM manifests WHERE environment = $1";
      const countResult = await pool.query(countQuery, [data.environment]);
      const total = Number(countResult.rows[0].total);

      // Get paginated results
      const query = `
        SELECT 
          m.manifest_cid,
          m.first_seen_at,
          COUNT(nm.node_id) as node_count
        FROM manifests m
        LEFT JOIN node_manifests nm ON m.manifest_cid = nm.manifest_cid AND nm.environment = $3
        WHERE m.environment = $3
        GROUP BY m.manifest_cid, m.first_seen_at
        ORDER BY m.first_seen_at DESC
        LIMIT $1 OFFSET $2
      `;
    const result = await pool.query(query, [limit, offset, data.environment]);

    const totalPages = Math.ceil(total / limit);

    return {
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
    };
  });
