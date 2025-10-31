import { describe, it, expect } from "vitest";
import { canonicalJsonSerialize } from "../src/serialization.js";
import type { NodeMetricsSignable } from "../src/types.js";

describe("Serialization", () => {
  describe("canonicalJsonSerialize", () => {
    it("should serialize metrics data deterministically", () => {
      const data: NodeMetricsSignable = {
        ipfsPeerId: "peer123",
        ceramicPeerId: "ceramic456",
        environment: "testnet",
        totalStreams: 10,
        totalPinnedCids: 5,
        collectedAt: "2024-01-01T00:00:00.000Z",
      };

      const json1 = canonicalJsonSerialize(data);
      const json2 = canonicalJsonSerialize(data);

      expect(json1).toBe(json2);
    });

    it("should produce identical output for the same data structure", () => {
      const data: NodeMetricsSignable = {
        ipfsPeerId: "peer123",
        ceramicPeerId: "ceramic456",
        environment: "testnet",
        totalStreams: 10,
        totalPinnedCids: 5,
        collectedAt: "2024-01-01T00:00:00.000Z",
      };

      const json1 = canonicalJsonSerialize(data);
      const json2 = canonicalJsonSerialize(data);

      expect(json1).toBe(json2);
    });

    it("should produce valid JSON", () => {
      const data: NodeMetricsSignable = {
        ipfsPeerId: "peer123",
        ceramicPeerId: "ceramic456",
        environment: "mainnet",
        totalStreams: 100,
        totalPinnedCids: 50,
        collectedAt: "2024-01-01T00:00:00.000Z",
      };

      const json = canonicalJsonSerialize(data);
      const parsed = JSON.parse(json);

      // Verify data integrity
      expect(parsed.ipfsPeerId).toBe("peer123");
      expect(parsed.environment).toBe("mainnet");
      expect(parsed.totalStreams).toBe(100);
      expect(parsed.ceramicPeerId).toBe("ceramic456");
      expect(parsed.totalPinnedCids).toBe(50);
      expect(parsed.collectedAt).toBe("2024-01-01T00:00:00.000Z");
    });

    it("should validate input data using schema", () => {
      const invalidData = {
        ipfsPeerId: "peer123",
        // Missing required fields
      };

      expect(() => canonicalJsonSerialize(invalidData as any)).toThrow();
    });
  });
});
