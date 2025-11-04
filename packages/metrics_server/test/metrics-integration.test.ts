import { describe, it, expect, beforeEach } from "vitest";
import { validateMetricsSignature } from "../src/validation.js";
import {
  signMetrics,
  NodeMetricsGranularSchema,
  extractSignableData,
  type NodeMetricsSignable,
  type NodeMetricsGranular,
} from "@desci-labs/desci-codex-metrics";
import { generateKeyPair } from "@libp2p/crypto/keys";
import { peerIdFromPrivateKey } from "@libp2p/peer-id";
import type { Ed25519PrivateKey, PeerId } from "@libp2p/interface";

/**
 * Tests for metrics_server processing pipeline and API contract compliance.
 * Focuses on server-specific data processing, schema validation, and database preparation.
 * Security validation is thoroughly tested in \@desci-labs/desci-codex-metrics library.
 */
describe("Metrics Server Processing", () => {
  let privateKey: Ed25519PrivateKey;
  let peerId: PeerId;

  beforeEach(async () => {
    privateKey = await generateKeyPair("Ed25519");
    peerId = peerIdFromPrivateKey(privateKey);
  });

  describe("Request Processing Pipeline", () => {
    it("should parse incoming metrics with NodeMetricsGranularSchema", async () => {
      const signableData: NodeMetricsSignable = {
        nodeId: `node-${peerId.toString().slice(0, 8)}`,
        ceramicPeerId: peerId.toString(),
        environment: "testnet",
        manifests: [
          "bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku",
        ],
        streams: [
          {
            streamId: "stream1",
            streamCid:
              "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
            eventIds: ["event1", "event2"],
          },
        ],
        collectedAt: new Date().toISOString(),
      };

      const signedMetrics = await signMetrics(signableData, privateKey);

      // Simulate what happens in index.ts: parse incoming request body
      expect(() =>
        NodeMetricsGranularSchema.parse(signedMetrics),
      ).not.toThrow();

      const parsed = NodeMetricsGranularSchema.parse(signedMetrics);
      expect(parsed.ceramicPeerId).toBe(peerId.toString());
      expect(parsed.environment).toBe("testnet");
      expect(parsed.manifests).toHaveLength(1);
      expect(parsed.streams).toHaveLength(1);
    });

    it("should extract data for database storage", async () => {
      const signableData: NodeMetricsSignable = {
        nodeId: `node-${peerId.toString().slice(0, 8)}`,
        ceramicPeerId: peerId.toString(),
        environment: "mainnet",
        manifests: ["cid1", "cid2"],
        streams: [
          {
            streamId: "stream1",
            streamCid: "streamCid1",
            eventIds: ["event1", "event2"],
          },
        ],
        collectedAt: "2024-01-01T00:00:00.000Z",
      };

      const signedMetrics = await signMetrics(signableData, privateKey);
      const extractedData = extractSignableData(signedMetrics);

      // Verify data extraction for database (removing signature)
      expect(extractedData).toEqual(signableData);
      expect(extractedData).not.toHaveProperty("signature");

      // Simulate database format transformation (as done in index.ts)
      const dbFormat = {
        nodeId: extractedData.nodeId,
        ceramicPeerId: extractedData.ceramicPeerId,
        environment: extractedData.environment,
        manifests: extractedData.manifests,
        streams: extractedData.streams,
        collectedAt: extractedData.collectedAt,
      };

      expect(dbFormat.ceramicPeerId).toBe(peerId.toString());
      expect(dbFormat.environment).toBe("mainnet");
      expect(dbFormat.manifests).toHaveLength(2);
      expect(dbFormat.streams).toHaveLength(1);
    });

    it("should validate complete request-to-storage flow", async () => {
      const signableData: NodeMetricsSignable = {
        nodeId: `node-${peerId.toString().slice(0, 8)}`,
        ceramicPeerId: peerId.toString(),
        environment: "local",
        manifests: ["cid1", "cid2", "cid3"],
        streams: [
          {
            streamId: "stream1",
            streamCid: "streamCid1",
            eventIds: ["event1"],
          },
          {
            streamId: "stream2",
            streamCid: "streamCid2",
            eventIds: ["event2", "event3"],
          },
        ],
        collectedAt: new Date().toISOString(),
      };

      const signedMetrics = await signMetrics(signableData, privateKey);

      // Step 1: Parse request (simulating Express middleware)
      const parsedMetrics = NodeMetricsGranularSchema.parse(signedMetrics);

      // Step 2: Validate signature (simulating validation middleware)
      const validationResult = await validateMetricsSignature(parsedMetrics);
      expect(validationResult.isValid).toBe(true);

      // Step 3: Extract for database storage (simulating storage preparation)
      const dbData = extractSignableData(parsedMetrics);
      expect(dbData.ceramicPeerId).toBe(peerId.toString());
      expect(dbData.environment).toBe("local");
    });
  });

  describe("Error Handling", () => {
    it("should reject malformed request bodies", async () => {
      const invalidInputs = [
        // Missing required fields
        { nodeId: "node-123", environment: "testnet" },
        // Wrong field types
        {
          nodeId: "node-123",
          ceramicPeerId: peerId.toString(),
          environment: "invalid-env",
          manifests: "not-an-array",
          streams: [],
          collectedAt: "2024-01-01T00:00:00.000Z",
          signature: [1, 2, 3],
        },
        // Invalid signature format
        {
          nodeId: "node-123",
          ceramicPeerId: peerId.toString(),
          environment: "testnet",
          manifests: [],
          streams: [],
          collectedAt: "2024-01-01T00:00:00.000Z",
          signature: "not-an-array",
        },
      ];

      for (const invalid of invalidInputs) {
        expect(() => NodeMetricsGranularSchema.parse(invalid)).toThrow();
      }
    });

    it("should handle validation failures gracefully", async () => {
      const metricsWithBadPeerId = {
        nodeId: "node-123",
        ceramicPeerId: "invalid-peer-id-format",
        environment: "testnet" as const,
        manifests: [],
        streams: [],
        collectedAt: new Date().toISOString(),
        signature: [1, 2, 3], // Invalid signature
      };

      const result = await validateMetricsSignature(metricsWithBadPeerId);
      expect(result.isValid).toBe(false);
      expect(typeof result.error).toBe("string");
    });
  });

  describe("API Contract Compliance", () => {
    it("should handle all supported environments", async () => {
      const environments = ["testnet", "mainnet", "local"] as const;

      for (const environment of environments) {
        const signableData: NodeMetricsSignable = {
          nodeId: `node-${peerId.toString().slice(0, 8)}`,
          ceramicPeerId: peerId.toString(),
          environment,
          manifests: ["cid1"],
          streams: [
            {
              streamId: "stream1",
              streamCid: "streamCid1",
              eventIds: ["event1"],
            },
          ],
          collectedAt: new Date().toISOString(),
        };

        const signedMetrics = await signMetrics(signableData, privateKey);

        // Verify server can process this environment
        expect(() =>
          NodeMetricsGranularSchema.parse(signedMetrics),
        ).not.toThrow();

        const validationResult = await validateMetricsSignature(signedMetrics);
        expect(validationResult.isValid).toBe(true);
      }
    });

    it("should maintain compatibility with node package output format", async () => {
      // Simulate the exact format sent by node package
      const nodeOutput: NodeMetricsGranular = {
        nodeId: `node-${peerId.toString().slice(0, 8)}`,
        ceramicPeerId: peerId.toString(),
        environment: "testnet",
        manifests: ["cid1", "cid2"],
        streams: [
          {
            streamId: "stream1",
            streamCid: "streamCid1",
            eventIds: ["event1", "event2"],
          },
        ],
        collectedAt: new Date().toISOString(),
        signature: [1, 2, 3, 4, 5], // Dummy signature for structure test
      };

      // Verify server can parse node output
      expect(() => NodeMetricsGranularSchema.parse(nodeOutput)).not.toThrow();

      // Verify server can extract data for storage
      const extracted = extractSignableData(nodeOutput);
      expect(extracted.ceramicPeerId).toBe(peerId.toString());
      expect(extracted.environment).toBe("testnet");
      expect(extracted.manifests).toHaveLength(2);
      expect(extracted.streams).toHaveLength(1);
    });
  });
});
