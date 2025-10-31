import { describe, it, expect, beforeEach } from "vitest";
import { validateMetricsSignature } from "../src/validation.js";
import { signMetrics, type NodeMetricsSignable } from "@codex/metrics";
import { generateKeyPair } from "@libp2p/crypto/keys";
import { peerIdFromPrivateKey } from "@libp2p/peer-id";
import type { Ed25519PrivateKey, PeerId } from "@libp2p/interface";

/**
 * Tests for metrics_server validation module.
 * Focuses on server-specific validation concerns and library integration.
 * Detailed cryptographic validation is tested in \@codex/metrics library.
 */
describe("Metrics Server Validation", () => {
  let privateKey: Ed25519PrivateKey;
  let peerId: PeerId;

  beforeEach(async () => {
    privateKey = await generateKeyPair("Ed25519");
    peerId = peerIdFromPrivateKey(privateKey);
  });

  describe("Validation Module Integration", () => {
    it("should correctly re-export @codex/metrics validation function", async () => {
      const metricsData: NodeMetricsSignable = {
        ipfsPeerId: peerId.toString(),
        ceramicPeerId: peerId.toString(),
        environment: "testnet",
        totalStreams: 5,
        totalPinnedCids: 10,
        collectedAt: new Date().toISOString(),
      };

      const signedMetrics = await signMetrics(metricsData, privateKey);
      const result = await validateMetricsSignature(signedMetrics);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should handle validation errors gracefully", async () => {
      const invalidMetrics = {
        identity: {
          ipfs: "invalid-peer-id",
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

      const result = await validateMetricsSignature(invalidMetrics);

      expect(result.isValid).toBe(false);
      expect(typeof result.error).toBe("string");
      expect(result.error).toContain("Invalid peer ID format");
    });

    it("should support all required environments", async () => {
      const environments = ["testnet", "mainnet", "local"] as const;

      for (const environment of environments) {
        const metricsData: NodeMetricsSignable = {
          ipfsPeerId: peerId.toString(),
          ceramicPeerId: peerId.toString(),
          environment,
          totalStreams: 1,
          totalPinnedCids: 1,
          collectedAt: new Date().toISOString(),
        };

        const signedMetrics = await signMetrics(metricsData, privateKey);
        const result = await validateMetricsSignature(signedMetrics);

        expect(result.isValid).toBe(true);
        expect(signedMetrics.environment).toBe(environment);
      }
    });
  });
});
