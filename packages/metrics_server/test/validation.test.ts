import { describe, it, expect, beforeEach } from "vitest";
import {
  signMetrics,
  validateMetricsSignature,
  type NodeMetricsSignable,
} from "@desci-labs/desci-codex-metrics";
import { generateKeyPair } from "@libp2p/crypto/keys";
import { peerIdFromPrivateKey } from "@libp2p/peer-id";
import type { Ed25519PrivateKey, PeerId } from "@libp2p/interface";

/**
 * Tests for metrics_server validation module.
 * Focuses on server-specific validation concerns and library integration.
 * Detailed cryptographic validation is tested in \@desci-labs/desci-codex-metrics library.
 */
describe("Metrics Server Validation", () => {
  let privateKey: Ed25519PrivateKey;
  let peerId: PeerId;

  beforeEach(async () => {
    privateKey = await generateKeyPair("Ed25519");
    peerId = peerIdFromPrivateKey(privateKey);
  });

  describe("Validation Module Integration", () => {
    it("should correctly re-export @desci-labs/desci-codex-metrics validation function", async () => {
      const metricsData: NodeMetricsSignable = {
        nodeId: peerId.toString(),
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
      };

      const signedMetrics = await signMetrics(metricsData, privateKey);
      const result = await validateMetricsSignature(signedMetrics);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should handle validation errors gracefully", async () => {
      const invalidMetrics = {
        nodeId: "node-123",
        ceramicPeerId: "invalid-peer-id",
        environment: "testnet" as const,
        manifests: [],
        streams: [],
        collectedAt: new Date().toISOString(),
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
          nodeId: peerId.toString(),
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

        const signedMetrics = await signMetrics(metricsData, privateKey);
        const result = await validateMetricsSignature(signedMetrics);

        expect(result.isValid).toBe(true);
        expect(signedMetrics.environment).toBe(environment);
      }
    });
  });
});
