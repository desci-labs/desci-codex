import { describe, it, expect } from "vitest";
import { canonicalJsonSerialize } from "../src/serialization.js";
import type { NodeMetricsSignable } from "../src/types.js";

describe("Serialization", () => {
  describe("canonicalJsonSerialize", () => {
    it("should serialize metrics data deterministically", () => {
      const data: NodeMetricsSignable = {
        nodeId: "node-123",
        peerId: "peer123",
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

    it("should produce identical output for the same data structure", () => {
      const data: NodeMetricsSignable = {
        nodeId: "node-123",
        peerId: "peer123",
        environment: "testnet",
        manifests: [],
        streams: [
          {
            streamId: "stream1",
            streamCid:
              "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
            eventIds: ["event1"],
          },
        ],
        collectedAt: "2024-01-01T00:00:00.000Z",
      };

      const json1 = canonicalJsonSerialize(data);
      const json2 = canonicalJsonSerialize(data);

      expect(json1).toBe(json2);
    });

    it("should produce valid JSON", () => {
      const data: NodeMetricsSignable = {
        nodeId: "node-123",
        peerId: "peer123",
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
      expect(parsed.nodeId).toBe("node-123");
      expect(parsed.peerId).toBe("peer123");
      expect(parsed.environment).toBe("mainnet");
      expect(parsed.manifests).toHaveLength(1);
      expect(parsed.streams).toHaveLength(0);
      expect(parsed.collectedAt).toBe("2024-01-01T00:00:00.000Z");
    });

    it("should validate input data using schema", () => {
      const invalidData = {
        peerId: "peer123",
        // Missing required fields
      };

      expect(() =>
        canonicalJsonSerialize(invalidData as Record<string, unknown>),
      ).toThrow();
    });
  });
});
