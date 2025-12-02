import { describe, it, expect } from "vitest";
import { canonicalJsonSerialize } from "../src/serialization.js";
import type { NodeMetricsSignable } from "../src/types.js";
import { newPeerIdString } from "./test-utils.js";

describe("Serialization", () => {
  describe("canonicalJsonSerialize", () => {
    it("should serialize metrics data deterministically", async () => {
      const data: NodeMetricsSignable = {
        nodeId: await newPeerIdString(),
        ceramicPeerId: await newPeerIdString(),
        environment: "testnet",
        manifests: [
          "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        ],
        streams: [],
        collectedAt: "2024-01-01T00:00:00.000Z",
      };

      const json1 = canonicalJsonSerialize(data);
      const json2 = canonicalJsonSerialize(data);

      expect(json1).toBe(json2);
    });

    it("should produce identical output for the same data structure", async () => {
      const nodeId = await newPeerIdString();
      const ceramicPeerId = await newPeerIdString();
      const data: NodeMetricsSignable = {
        nodeId,
        ceramicPeerId,
        environment: "testnet",
        manifests: [],
        streams: [
          {
            streamId: "stream1",
            eventIds: ["event1"],
          },
        ],
        collectedAt: "2024-01-01T00:00:00.000Z",
      };

      const json1 = canonicalJsonSerialize(data);
      const json2 = canonicalJsonSerialize(data);

      expect(json1).toBe(json2);
    });

    it("should produce valid JSON", async () => {
      const nodeId = await newPeerIdString();
      const ceramicPeerId = await newPeerIdString();
      const data: NodeMetricsSignable = {
        nodeId,
        ceramicPeerId,
        environment: "mainnet",
        manifests: [
          "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        ],
        streams: [],
        collectedAt: "2024-01-01T00:00:00.000Z",
      };

      const json = canonicalJsonSerialize(data);
      const parsed = JSON.parse(json);

      // Verify data integrity
      expect(parsed.nodeId).toBe(nodeId);
      expect(parsed.ceramicPeerId).toBe(ceramicPeerId);
      expect(parsed.environment).toBe("mainnet");
      expect(parsed.manifests).toHaveLength(1);
      expect(parsed.streams).toHaveLength(0);
      expect(parsed.collectedAt).toBe("2024-01-01T00:00:00.000Z");
    });

    it("should validate input data using schema", () => {
      const invalidData = {
        ceramicPeerId: "peer123",
        // Missing required fields
      };

      expect(() =>
        canonicalJsonSerialize(invalidData as Record<string, unknown>),
      ).toThrow();
    });
  });
});
