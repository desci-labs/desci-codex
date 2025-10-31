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
 * Integration tests to ensure compatibility with \@codex/metrics library.
 * These tests verify that:
 * 1. metrics_server can validate metrics from \@codex/metrics
 * 2. Any changes to \@codex/metrics API will cause test failures here
 * 3. The complete flow from node -\> \@codex/metrics -\> metrics_server validation works
 */
describe("Metrics Server Library Integration", () => {
  let privateKey: Ed25519PrivateKey;
  let peerId: PeerId;

  beforeEach(async () => {
    privateKey = await generateKeyPair("Ed25519");
    peerId = peerIdFromPrivateKey(privateKey);
  });

  describe("Schema Processing", () => {
    it("should successfully process metrics created by @codex/metrics", async () => {
      const signableData: NodeMetricsSignable = {
        ipfsPeerId: peerId.toString(),
        ceramicPeerId: peerId.toString(),
        environment: "testnet",
        totalStreams: 42,
        totalPinnedCids: 24,
        collectedAt: new Date().toISOString(),
      };

      // Create signed metrics using @codex/metrics
      const signedMetrics = await signMetrics(signableData, privateKey);

      // Verify schema validation passes
      expect(() =>
        NodeMetricsInternalSchema.parse(signedMetrics),
      ).not.toThrow();

      // Verify structure validation passes
      const validationResult = await validateMetricsSignature(signedMetrics);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.error).toBeUndefined();
    });

    it("should properly extract signable data for database storage", async () => {
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

      // Verify extracted data matches original
      expect(extractedData).toEqual(signableData);
      expect(extractedData).not.toHaveProperty("signature");

      // Verify we can reconstruct flat format for database
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
  });

  describe("Validation Integration", () => {
    it("should validate all supported environments using @codex/metrics", async () => {
      const environments = ["testnet", "mainnet", "local"] as const;

      for (const environment of environments) {
        const signableData: NodeMetricsSignable = {
          ipfsPeerId: peerId.toString(),
          ceramicPeerId: peerId.toString(),
          environment,
          totalStreams: 10,
          totalPinnedCids: 5,
          collectedAt: new Date().toISOString(),
        };

        const signedMetrics = await signMetrics(signableData, privateKey);
        const validationResult = await validateMetricsSignature(signedMetrics);

        expect(validationResult.isValid).toBe(true);
        expect(validationResult.error).toBeUndefined();
        expect(signedMetrics.environment).toBe(environment);
      }
    });

    it("should reject tampered data using @codex/metrics validation", async () => {
      const signableData: NodeMetricsSignable = {
        ipfsPeerId: peerId.toString(),
        ceramicPeerId: peerId.toString(),
        environment: "local",
        totalStreams: 20,
        totalPinnedCids: 15,
        collectedAt: new Date().toISOString(),
      };

      const signedMetrics = await signMetrics(signableData, privateKey);

      // Tamper with the data
      signedMetrics.summary.totalStreams = 999;

      const validationResult = await validateMetricsSignature(signedMetrics);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.error).toBe(
        "Cryptographic signature verification failed",
      );
    });

    it("should reject impersonation attempts using @codex/metrics validation", async () => {
      const victimKey = await generateKeyPair("Ed25519");
      const victimPeerId = peerIdFromPrivateKey(victimKey);
      const attackerKey = await generateKeyPair("Ed25519");

      // Attacker tries to create metrics claiming to be victim
      const fakeData: NodeMetricsSignable = {
        ipfsPeerId: victimPeerId.toString(),
        ceramicPeerId: victimPeerId.toString(),
        environment: "testnet",
        totalStreams: 1000,
        totalPinnedCids: 500,
        collectedAt: new Date().toISOString(),
      };

      // Sign with attacker's key
      const maliciousMetrics = await signMetrics(fakeData, attackerKey);

      const validationResult = await validateMetricsSignature(maliciousMetrics);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.error).toBe(
        "Cryptographic signature verification failed",
      );
    });
  });

  describe("API Contract Compliance", () => {
    it("should handle the expected metrics format from node package", async () => {
      // Simulate what the node package sends
      const nodeMetrics: NodeMetricsInternal = {
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

      // Verify schema parsing works
      expect(() => NodeMetricsInternalSchema.parse(nodeMetrics)).not.toThrow();

      // Verify data extraction works
      const extracted = extractSignableData(nodeMetrics);
      expect(extracted.ipfsPeerId).toBe(peerId.toString());
      expect(extracted.environment).toBe("testnet");
      expect(extracted.totalStreams).toBe(42);
      expect(extracted.totalPinnedCids).toBe(24);
    });

    it("should reject invalid schemas to prevent security issues", async () => {
      const invalidMetrics = [
        // Missing required fields
        {
          identity: { ipfs: peerId.toString() },
          environment: "testnet",
        },
        // Wrong types
        {
          identity: { ipfs: peerId.toString(), ceramic: peerId.toString() },
          environment: "invalid",
          summary: {
            totalStreams: "not a number",
            totalPinnedCids: 5,
            collectedAt: "2024-01-01T00:00:00.000Z",
          },
          signature: [1, 2, 3],
        },
        // Invalid signature
        {
          identity: { ipfs: peerId.toString(), ceramic: peerId.toString() },
          environment: "testnet",
          summary: {
            totalStreams: 5,
            totalPinnedCids: 5,
            collectedAt: "2024-01-01T00:00:00.000Z",
          },
          signature: "not an array",
        },
      ];

      for (const invalid of invalidMetrics) {
        expect(() => NodeMetricsInternalSchema.parse(invalid)).toThrow();
      }
    });
  });

  describe("Breaking Change Detection", () => {
    it("should detect if @codex/metrics changes its signing behavior", async () => {
      const signableData: NodeMetricsSignable = {
        ipfsPeerId: peerId.toString(),
        ceramicPeerId: peerId.toString(),
        environment: "testnet",
        totalStreams: 1,
        totalPinnedCids: 1,
        collectedAt: "2024-01-01T00:00:00.000Z",
      };

      // Create metrics twice with same data
      const metrics1 = await signMetrics(signableData, privateKey);
      const metrics2 = await signMetrics(signableData, privateKey);

      // Signatures should be identical for identical data (deterministic)
      expect(metrics1.signature).toEqual(metrics2.signature);

      // Both should validate
      expect((await validateMetricsSignature(metrics1)).isValid).toBe(true);
      expect((await validateMetricsSignature(metrics2)).isValid).toBe(true);

      // If this test starts failing, \@codex/metrics signing behavior changed
    });

    it("should detect if @codex/metrics changes its schema format", async () => {
      const signableData: NodeMetricsSignable = {
        ipfsPeerId: peerId.toString(),
        ceramicPeerId: peerId.toString(),
        environment: "testnet",
        totalStreams: 5,
        totalPinnedCids: 3,
        collectedAt: new Date().toISOString(),
      };

      const signedMetrics = await signMetrics(signableData, privateKey);

      // Verify expected nested structure still exists
      expect(signedMetrics).toHaveProperty("identity");
      expect(signedMetrics).toHaveProperty("environment");
      expect(signedMetrics).toHaveProperty("summary");
      expect(signedMetrics).toHaveProperty("signature");

      expect(signedMetrics.identity).toHaveProperty("ipfs");
      expect(signedMetrics.identity).toHaveProperty("ceramic");
      expect(signedMetrics.summary).toHaveProperty("totalStreams");
      expect(signedMetrics.summary).toHaveProperty("totalPinnedCids");
      expect(signedMetrics.summary).toHaveProperty("collectedAt");

      // If this test starts failing, \@codex/metrics format changed
    });
  });
});
