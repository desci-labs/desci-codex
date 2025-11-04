import { describe, it, expect, beforeEach } from "vitest";
import { generateKeyPair } from "@libp2p/crypto/keys";
import { peerIdFromPrivateKey } from "@libp2p/peer-id";
import type { Ed25519PrivateKey, PeerId } from "@libp2p/interface";
import {
  type NodeMetricsSignable,
  signMetrics,
  validateMetricsSignature,
  extractSignableData,
  canonicalJsonSerialize,
} from "../src/index.js";

describe("End-to-End Integration Tests", () => {
  let privateKey: Ed25519PrivateKey;
  let peerId: PeerId;

  beforeEach(async () => {
    privateKey = await generateKeyPair("Ed25519");
    peerId = peerIdFromPrivateKey(privateKey);
  });

  describe("Producer → Consumer Flow (with libp2p peer ID security)", () => {
    it("should handle the complete flow from producer to consumer", async () => {
      // This test demonstrates the complete security model where:
      // 1. Each node has a unique libp2p peer ID that contains their public key
      // 2. Metrics are signed with the node's private key
      // 3. The consumer can verify authenticity using the public key from the peer ID
      // 4. This prevents impersonation and ensures data integrity

      // Step 1: Producer creates signable metrics data (simulating node package)
      const signableData: NodeMetricsSignable = {
        nodeId: `node-${peerId.toString().slice(0, 8)}`,
        ceramicPeerId: peerId.toString(),
        environment: "testnet",
        manifests: [
          "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
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

      // Step 2: Sign the metrics (creates internal format with signature)
      const signedMetrics = await signMetrics(signableData, privateKey);

      // Step 3: Transmit (simulated - just checking serialization works)
      const transmitted = JSON.stringify(signedMetrics);
      const received = JSON.parse(transmitted);

      // Step 4: Consumer validates the signature (simulating metrics_server)
      const validationResult = await validateMetricsSignature(received);

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.error).toBeUndefined();

      // Verify data integrity
      expect(received.ceramicPeerId).toBe(peerId.toString());
      expect(received.manifests).toHaveLength(2);
      expect(received.streams).toHaveLength(1);
      expect(received.streams[0].eventIds).toHaveLength(2);
    });

    it("should demonstrate peer ID as public key (libp2p core security feature)", async () => {
      // This test explicitly demonstrates that libp2p peer IDs contain public keys
      const metricsData: NodeMetricsSignable = {
        nodeId: `node-${peerId.toString().slice(0, 8)}`,
        ceramicPeerId: peerId.toString(),
        environment: "testnet",
        manifests: [],
        streams: [
          {
            streamId: "stream42",
            streamCid:
              "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
            eventIds: ["event1"],
          },
        ],
        collectedAt: "2024-01-01T00:00:00.000Z",
      };

      // Sign the metrics
      const signedMetrics = await signMetrics(metricsData, privateKey);

      // Extract the public key directly from the peer ID (critical libp2p feature)
      const publicKeyFromPeerId = peerId.publicKey!;
      expect(publicKeyFromPeerId).toBeDefined();

      // Manually verify signature using the public key extracted from peer ID
      const dataToVerify = extractSignableData(signedMetrics);
      const canonicalJson = canonicalJsonSerialize(dataToVerify);
      const dataBytes = new TextEncoder().encode(canonicalJson);
      const signatureBytes = new Uint8Array(signedMetrics.signature);

      // This verification proves that:
      // 1. The peer ID contains the public key
      // 2. The signature was created by the corresponding private key
      // 3. The data hasn't been tampered with
      const isValid = await publicKeyFromPeerId.verify(
        dataBytes,
        signatureBytes,
      );
      expect(isValid).toBe(true);

      // Also verify that our validation function works the same way
      const validationResult = await validateMetricsSignature(signedMetrics);
      expect(validationResult.isValid).toBe(true);
    });

    it("should use deterministic serialization for reliable signature verification", async () => {
      // This test ensures our canonical serialization produces deterministic output
      const metricsData: NodeMetricsSignable = {
        nodeId: `node-${peerId.toString().slice(0, 8)}`,
        ceramicPeerId: peerId.toString(),
        environment: "testnet",
        manifests: [
          "bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku",
        ],
        streams: [],
        collectedAt: "2024-01-01T00:00:00.000Z",
      };

      // Sign using our new utilities
      const signedMetrics = await signMetrics(metricsData, privateKey);

      // Manually verify using our canonical serialization
      const dataToVerify = extractSignableData(signedMetrics);
      const canonicalJson = canonicalJsonSerialize(dataToVerify);
      const canonicalBytes = new TextEncoder().encode(canonicalJson);
      const signatureBytes = new Uint8Array(signedMetrics.signature);

      const isValid = await peerId.publicKey!.verify(
        canonicalBytes,
        signatureBytes,
      );
      expect(isValid).toBe(true);

      // Verify that our serialization is deterministic
      const canonicalJson2 = canonicalJsonSerialize(metricsData);
      expect(canonicalJson).toBe(canonicalJson2);
    });

    it("should reject tampered data", async () => {
      const metricsData: NodeMetricsSignable = {
        nodeId: `node-${peerId.toString().slice(0, 8)}`,
        ceramicPeerId: peerId.toString(),
        environment: "mainnet",
        manifests: [],
        streams: [
          {
            streamId: "stream10",
            streamCid:
              "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
            eventIds: ["event1"],
          },
        ],
        collectedAt: new Date().toISOString(),
      };

      const signedMetrics = await signMetrics(metricsData, privateKey);

      // Tamper with the data after signing
      signedMetrics.streams[0].streamId = "tampered";

      const validationResult = await validateMetricsSignature(signedMetrics);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.error).toBe(
        "Cryptographic signature verification failed",
      );
    });

    it("should reject impersonation attempts (peer ID as public key verification)", async () => {
      // Create attacker's key and peer ID
      const attackerKey = await generateKeyPair("Ed25519");
      const attackerPeerId = peerIdFromPrivateKey(attackerKey);

      // Create victim's key and peer ID
      const victimKey = await generateKeyPair("Ed25519");
      const victimPeerId = peerIdFromPrivateKey(victimKey);

      // Attacker tries to sign metrics claiming to be the victim
      const metricsData: NodeMetricsSignable = {
        nodeId: `node-${victimPeerId.toString().slice(0, 8)}`,
        ceramicPeerId: victimPeerId.toString(), // Claiming to be victim
        environment: "local",
        manifests: [],
        streams: [],
        collectedAt: new Date().toISOString(),
      };

      // Sign with attacker's key
      const maliciousMetrics = await signMetrics(metricsData, attackerKey);

      // CRITICAL SECURITY TEST: Validation should fail because the claimed peer ID
      // contains the victim's public key, but the signature was created with the attacker's private key.
      // This demonstrates that peer IDs ARE public keys in libp2p.
      const validationResult = await validateMetricsSignature(maliciousMetrics);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.error).toBe(
        "Cryptographic signature verification failed",
      );

      // Explicitly verify the peer ID contains the public key
      expect(victimPeerId.publicKey).toBeDefined();
      expect(attackerPeerId.publicKey).toBeDefined();
      expect(victimPeerId.toString()).not.toBe(attackerPeerId.toString());
    });

    it("should handle all supported environments", async () => {
      const environments = ["testnet", "mainnet", "local"] as const;

      for (const env of environments) {
        const metricsData: NodeMetricsSignable = {
          nodeId: `node-${peerId.toString().slice(0, 8)}`,
          ceramicPeerId: peerId.toString(),
          environment: env,
          manifests: [],
          streams: [],
          collectedAt: new Date().toISOString(),
        };

        const signedMetrics = await signMetrics(metricsData, privateKey);
        const validationResult = await validateMetricsSignature(signedMetrics);

        expect(validationResult.isValid).toBe(true);
        expect(signedMetrics.environment).toBe(env);
      }
    });
  });

  describe("Deterministic Serialization", () => {
    it("should produce deterministic output for the same data", () => {
      const data: NodeMetricsSignable = {
        nodeId: "node-123",
        ceramicPeerId: "peer123",
        environment: "testnet",
        manifests: [
          "bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku",
        ],
        streams: [],
        collectedAt: "2024-01-01T00:00:00.000Z",
      };

      const serialized1 = canonicalJsonSerialize(data);
      const serialized2 = canonicalJsonSerialize(data);

      // Should produce identical output
      expect(serialized1).toBe(serialized2);

      // Should be valid JSON
      const parsed = JSON.parse(serialized1);
      expect(parsed.ceramicPeerId).toBe("peer123");
      expect(parsed.environment).toBe("testnet");
    });
  });
});
