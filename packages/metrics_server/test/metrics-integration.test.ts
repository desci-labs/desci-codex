import { describe, it, expect, beforeEach } from "vitest";
import { validateMetricsSignature } from "../src/validation.js";
import {
  signMetrics,
  NodeMetricsInternalSchema,
  extractSignableData,
  type NodeMetricsSignable,
  type NodeMetricsInternal,
} from "@codex/metrics";
import { generateKeyPair } from "@libp2p/crypto/keys";
import { peerIdFromPrivateKey } from "@libp2p/peer-id";
import type { Ed25519PrivateKey, PeerId } from "@libp2p/interface";

/**
 * Tests for metrics_server processing pipeline and API contract compliance.
 * Focuses on server-specific data processing, schema validation, and database preparation.
 * Security validation is thoroughly tested in \@codex/metrics library.
 */
describe("Metrics Server Processing", () => {
  let privateKey: Ed25519PrivateKey;
  let peerId: PeerId;

  beforeEach(async () => {
    privateKey = await generateKeyPair("Ed25519");
    peerId = peerIdFromPrivateKey(privateKey);
  });

  describe("Request Processing Pipeline", () => {
    it("should parse incoming metrics with NodeMetricsInternalSchema", async () => {
      const signableData: NodeMetricsSignable = {
        ipfsPeerId: peerId.toString(),
        ceramicPeerId: peerId.toString(),
        environment: "testnet",
        totalStreams: 42,
        totalPinnedCids: 24,
        collectedAt: new Date().toISOString(),
      };

      const signedMetrics = await signMetrics(signableData, privateKey);

      // Simulate what happens in index.ts: parse incoming request body
      expect(() =>
        NodeMetricsInternalSchema.parse(signedMetrics),
      ).not.toThrow();

      const parsed = NodeMetricsInternalSchema.parse(signedMetrics);
      expect(parsed.identity.ipfs).toBe(peerId.toString());
      expect(parsed.environment).toBe("testnet");
      expect(parsed.summary.totalStreams).toBe(42);
    });

    it("should extract data for database storage", async () => {
      const signableData: NodeMetricsSignable = {
        ipfsPeerId: peerId.toString(),
        ceramicPeerId: peerId.toString(),
        environment: "mainnet",
        totalStreams: 100,
        totalPinnedCids: 50,
        collectedAt: "2024-01-01T00:00:00.000Z",
      };

      const signedMetrics = await signMetrics(signableData, privateKey);
      const extractedData = extractSignableData(signedMetrics);

      // Verify data extraction for database (removing signature)
      expect(extractedData).toEqual(signableData);
      expect(extractedData).not.toHaveProperty("signature");

      // Simulate database format transformation (as done in index.ts)
      const dbFormat = {
        ipfsPeerId: extractedData.ipfsPeerId,
        ceramicPeerId: extractedData.ceramicPeerId,
        environment: extractedData.environment,
        totalStreams: extractedData.totalStreams,
        totalPinnedCids: extractedData.totalPinnedCids,
        collectedAt: extractedData.collectedAt,
      };

      expect(dbFormat.ipfsPeerId).toBe(peerId.toString());
      expect(dbFormat.environment).toBe("mainnet");
      expect(dbFormat.totalStreams).toBe(100);
      expect(dbFormat.totalPinnedCids).toBe(50);
    });

    it("should validate complete request-to-storage flow", async () => {
      const signableData: NodeMetricsSignable = {
        ipfsPeerId: peerId.toString(),
        ceramicPeerId: peerId.toString(),
        environment: "local",
        totalStreams: 5,
        totalPinnedCids: 3,
        collectedAt: new Date().toISOString(),
      };

      const signedMetrics = await signMetrics(signableData, privateKey);

      // Step 1: Parse request (simulating Express middleware)
      const parsedMetrics = NodeMetricsInternalSchema.parse(signedMetrics);

      // Step 2: Validate signature (simulating validation middleware)
      const validationResult = await validateMetricsSignature(parsedMetrics);
      expect(validationResult.isValid).toBe(true);

      // Step 3: Extract for database storage (simulating storage preparation)
      const dbData = extractSignableData(parsedMetrics);
      expect(dbData.ipfsPeerId).toBe(peerId.toString());
      expect(dbData.environment).toBe("local");
    });
  });

  describe("Error Handling", () => {
    it("should reject malformed request bodies", async () => {
      const invalidInputs = [
        // Missing required fields
        { identity: { ipfs: peerId.toString() }, environment: "testnet" },
        // Wrong field types
        {
          identity: { ipfs: peerId.toString(), ceramic: peerId.toString() },
          environment: "invalid-env",
          summary: {
            totalStreams: "not-a-number",
            totalPinnedCids: 5,
            collectedAt: "2024-01-01T00:00:00.000Z",
          },
          signature: [1, 2, 3],
        },
        // Invalid signature format
        {
          identity: { ipfs: peerId.toString(), ceramic: peerId.toString() },
          environment: "testnet",
          summary: {
            totalStreams: 5,
            totalPinnedCids: 5,
            collectedAt: "2024-01-01T00:00:00.000Z",
          },
          signature: "not-an-array",
        },
      ];

      for (const invalid of invalidInputs) {
        expect(() => NodeMetricsInternalSchema.parse(invalid)).toThrow();
      }
    });

    it("should handle validation failures gracefully", async () => {
      const metricsWithBadPeerId = {
        identity: {
          ipfs: "invalid-peer-id-format",
          ceramic: peerId.toString(),
        },
        environment: "testnet" as const,
        summary: {
          totalStreams: 5,
          totalPinnedCids: 10,
          collectedAt: new Date().toISOString(),
        },
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
          ipfsPeerId: peerId.toString(),
          ceramicPeerId: peerId.toString(),
          environment,
          totalStreams: 1,
          totalPinnedCids: 1,
          collectedAt: new Date().toISOString(),
        };

        const signedMetrics = await signMetrics(signableData, privateKey);

        // Verify server can process this environment
        expect(() =>
          NodeMetricsInternalSchema.parse(signedMetrics),
        ).not.toThrow();

        const validationResult = await validateMetricsSignature(signedMetrics);
        expect(validationResult.isValid).toBe(true);
      }
    });

    it("should maintain compatibility with node package output format", async () => {
      // Simulate the exact format sent by node package
      const nodeOutput: NodeMetricsInternal = {
        identity: {
          ipfs: peerId.toString(),
          ceramic: peerId.toString(),
        },
        environment: "testnet",
        summary: {
          totalStreams: 42,
          totalPinnedCids: 24,
          collectedAt: new Date().toISOString(),
        },
        signature: [1, 2, 3, 4, 5], // Dummy signature for structure test
      };

      // Verify server can parse node output
      expect(() => NodeMetricsInternalSchema.parse(nodeOutput)).not.toThrow();

      // Verify server can extract data for storage
      const extracted = extractSignableData(nodeOutput);
      expect(extracted.ipfsPeerId).toBe(peerId.toString());
      expect(extracted.environment).toBe("testnet");
      expect(extracted.totalStreams).toBe(42);
      expect(extracted.totalPinnedCids).toBe(24);
    });
  });
});
