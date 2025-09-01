import { describe, it, expect, beforeEach } from "vitest";
import {
  validateMetricsSignature,
  type SignedNodeMetrics,
} from "../src/validation.js";
import { generateKeyPair } from "@libp2p/crypto/keys";
import { peerIdFromPrivateKey } from "@libp2p/peer-id";
import type { Ed25519PrivateKey, PeerId } from "@libp2p/interface";

describe("Metrics Signature Validation", () => {
  let privateKey: Ed25519PrivateKey;
  let peerId: PeerId;

  beforeEach(async () => {
    privateKey = await generateKeyPair("Ed25519");
    peerId = peerIdFromPrivateKey(privateKey);
  });

  const createSignedMetrics = async (
    data: Omit<SignedNodeMetrics, "signature">,
    signingKey?: Ed25519PrivateKey,
  ): Promise<SignedNodeMetrics> => {
    const keyToUse = signingKey || privateKey;
    const dataBytes = new TextEncoder().encode(JSON.stringify(data));
    const signature = await keyToUse.sign(dataBytes);

    return {
      ...data,
      signature: Array.from(signature),
    };
  };

  describe("validateMetricsSignature", () => {
    it("should validate legitimate signatures", async () => {
      const metricsData = {
        ipfsPeerId: peerId.toString(),
        ceramicPeerId: peerId.toString(),
        environment: "testnet" as const,
        totalStreams: 5,
        totalPinnedCids: 10,
        collectedAt: new Date().toISOString(),
      };

      const signedMetrics = await createSignedMetrics(metricsData);
      const result = await validateMetricsSignature(signedMetrics);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject metrics with missing signature", async () => {
      const metricsData = {
        ipfsPeerId: peerId.toString(),
        ceramicPeerId: peerId.toString(),
        environment: "testnet" as const,
        totalStreams: 5,
        totalPinnedCids: 10,
        collectedAt: new Date().toISOString(),
        signature: [], // Empty signature
      };

      const result = await validateMetricsSignature(metricsData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Missing or invalid signature");
    });

    it("should reject metrics with invalid peer ID format", async () => {
      const metricsData = {
        ipfsPeerId: "invalid-peer-id",
        ceramicPeerId: peerId.toString(),
        environment: "testnet" as const,
        totalStreams: 5,
        totalPinnedCids: 10,
        collectedAt: new Date().toISOString(),
        signature: [1, 2, 3], // Dummy signature
      };

      const result = await validateMetricsSignature(metricsData);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Invalid peer ID format");
    });

    it("should reject tampered data", async () => {
      const metricsData = {
        ipfsPeerId: peerId.toString(),
        ceramicPeerId: peerId.toString(),
        environment: "testnet" as const,
        totalStreams: 5,
        totalPinnedCids: 10,
        collectedAt: new Date().toISOString(),
      };

      const signedMetrics = await createSignedMetrics(metricsData);

      // Tamper with the data after signing
      signedMetrics.totalStreams = 999;

      const result = await validateMetricsSignature(signedMetrics);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Cryptographic signature verification failed");
    });

    it("should reject signatures from different keys (impersonation attempt)", async () => {
      const attackerPrivateKey = await generateKeyPair("Ed25519");

      const metricsData = {
        ipfsPeerId: peerId.toString(), // Victim's peer ID
        ceramicPeerId: peerId.toString(),
        environment: "testnet" as const,
        totalStreams: 5,
        totalPinnedCids: 10,
        collectedAt: new Date().toISOString(),
      };

      // Sign with attacker's key but claim victim's peer ID
      const maliciousMetrics = await createSignedMetrics(
        metricsData,
        attackerPrivateKey,
      );

      const result = await validateMetricsSignature(maliciousMetrics);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Cryptographic signature verification failed");
    });

    it("should validate metrics for all supported environments", async () => {
      const environments = ["testnet", "mainnet", "local"] as const;

      for (const environment of environments) {
        const metricsData = {
          ipfsPeerId: peerId.toString(),
          ceramicPeerId: peerId.toString(),
          environment,
          totalStreams: 5,
          totalPinnedCids: 10,
          collectedAt: new Date().toISOString(),
        };

        const signedMetrics = await createSignedMetrics(metricsData);
        const result = await validateMetricsSignature(signedMetrics);

        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      }
    });
  });
});
