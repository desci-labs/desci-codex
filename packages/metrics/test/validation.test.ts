import { describe, it, expect, beforeEach } from "vitest";
import { generateKeyPair } from "@libp2p/crypto/keys";
import { peerIdFromPrivateKey } from "@libp2p/peer-id";
import type { Ed25519PrivateKey, PeerId } from "@libp2p/interface";
import {
  validateMetricsSignature,
  validateMetricsStructure,
} from "../src/validation.js";
import { signMetrics } from "../src/signing.js";
import type { NodeMetricsWire, NodeMetricsSignable } from "../src/types.js";

describe("Validation", () => {
  let privateKey: Ed25519PrivateKey;
  let peerId: PeerId;

  beforeEach(async () => {
    privateKey = await generateKeyPair("Ed25519");
    peerId = peerIdFromPrivateKey(privateKey);
  });

  describe("validateMetricsSignature", () => {
    it("should validate legitimate signatures", async () => {
      const metricsData: NodeMetricsSignable = {
        ipfsPeerId: peerId.toString(),
        ceramicPeerId: peerId.toString(),
        environment: "testnet",
        totalStreams: 10,
        totalPinnedCids: 5,
        collectedAt: new Date().toISOString(),
      };

      const signedMetrics = await signMetrics(metricsData, privateKey);
      const result = await validateMetricsSignature(signedMetrics);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject missing signature", async () => {
      const metrics: NodeMetricsWire = {
        ipfsPeerId: peerId.toString(),
        ceramicPeerId: peerId.toString(),
        environment: "testnet",
        totalStreams: 10,
        totalPinnedCids: 5,
        collectedAt: new Date().toISOString(),
        signature: [],
      };

      const result = await validateMetricsSignature(metrics);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Missing or invalid signature");
    });

    it("should reject invalid peer ID format", async () => {
      const metrics: NodeMetricsWire = {
        ipfsPeerId: "not-a-valid-peer-id",
        ceramicPeerId: "ceramic123",
        environment: "testnet",
        totalStreams: 10,
        totalPinnedCids: 5,
        collectedAt: new Date().toISOString(),
        signature: [1, 2, 3],
      };

      const result = await validateMetricsSignature(metrics);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Invalid peer ID format");
    });

    it("should reject peer ID without public key", async () => {
      // Create a peer ID string that's valid but doesn't encode a public key
      // This is a synthetic test case
      const metrics: NodeMetricsWire = {
        ipfsPeerId: "QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N", // Old style peer ID without key
        ceramicPeerId: "ceramic123",
        environment: "testnet",
        totalStreams: 10,
        totalPinnedCids: 5,
        collectedAt: new Date().toISOString(),
        signature: [1, 2, 3],
      };

      const result = await validateMetricsSignature(metrics);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Peer ID does not contain a public key");
    });

    it("should reject tampered data", async () => {
      const metricsData: NodeMetricsSignable = {
        ipfsPeerId: peerId.toString(),
        ceramicPeerId: peerId.toString(),
        environment: "testnet",
        totalStreams: 10,
        totalPinnedCids: 5,
        collectedAt: new Date().toISOString(),
      };

      const signedMetrics = await signMetrics(metricsData, privateKey);

      // Tamper with the data
      signedMetrics.totalStreams = 999;

      const result = await validateMetricsSignature(signedMetrics);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Cryptographic signature verification failed");
    });

    it("should reject signature from different key", async () => {
      const attackerKey = await generateKeyPair("Ed25519");

      const metricsData: NodeMetricsSignable = {
        ipfsPeerId: peerId.toString(), // Victim's peer ID
        ceramicPeerId: peerId.toString(),
        environment: "testnet",
        totalStreams: 10,
        totalPinnedCids: 5,
        collectedAt: new Date().toISOString(),
      };

      // Sign with attacker's key
      const maliciousMetrics = await signMetrics(metricsData, attackerKey);

      const result = await validateMetricsSignature(maliciousMetrics);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Cryptographic signature verification failed");
    });

    it("should handle all environments", async () => {
      const environments = ["testnet", "mainnet", "local"] as const;

      for (const env of environments) {
        const metricsData: NodeMetricsSignable = {
          ipfsPeerId: peerId.toString(),
          ceramicPeerId: peerId.toString(),
          environment: env,
          totalStreams: 10,
          totalPinnedCids: 5,
          collectedAt: new Date().toISOString(),
        };

        const signedMetrics = await signMetrics(metricsData, privateKey);
        const result = await validateMetricsSignature(signedMetrics);

        expect(result.isValid).toBe(true);
      }
    });

    it("should handle validation errors gracefully", async () => {
      const metrics = {
        ipfsPeerId: peerId.toString(),
        // Missing other required fields
      } as any;

      const result = await validateMetricsSignature(metrics);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Missing or invalid signature");
    });
  });

  describe("validateMetricsStructure", () => {
    const validMetrics: NodeMetricsWire = {
      ipfsPeerId: "12D3KooWExample",
      ceramicPeerId: "12D3KooWCeramic",
      environment: "testnet",
      totalStreams: 10,
      totalPinnedCids: 5,
      collectedAt: "2024-01-01T00:00:00.000Z",
      signature: [1, 2, 3],
    };

    it("should validate correct structure", () => {
      const result = validateMetricsStructure(validMetrics);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject non-objects", () => {
      expect(validateMetricsStructure(null).error).toBe(
        "Metrics must be an object",
      );
      expect(validateMetricsStructure(undefined).error).toBe(
        "Metrics must be an object",
      );
      expect(validateMetricsStructure("string").error).toBe(
        "Metrics must be an object",
      );
      expect(validateMetricsStructure(123).error).toBe(
        "Metrics must be an object",
      );
    });

    it("should reject missing required fields", () => {
      const fields = [
        "ipfsPeerId",
        "ceramicPeerId",
        "environment",
        "totalStreams",
        "totalPinnedCids",
        "collectedAt",
        "signature",
      ];

      for (const field of fields) {
        const incomplete = { ...validMetrics };
        delete (incomplete as any)[field];

        const result = validateMetricsStructure(incomplete);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(`Missing required field: ${field}`);
      }
    });

    it("should validate field types", () => {
      const testCases = [
        {
          field: "ipfsPeerId",
          value: "",
          error: "ipfsPeerId must be a non-empty string",
        },
        {
          field: "ipfsPeerId",
          value: 123,
          error: "ipfsPeerId must be a non-empty string",
        },
        {
          field: "ceramicPeerId",
          value: "",
          error: "ceramicPeerId must be a non-empty string",
        },
        {
          field: "environment",
          value: "prod",
          error: "environment must be one of: testnet, mainnet, local",
        },
        {
          field: "totalStreams",
          value: -1,
          error: "totalStreams must be a non-negative number",
        },
        {
          field: "totalStreams",
          value: "10",
          error: "totalStreams must be a non-negative number",
        },
        {
          field: "totalPinnedCids",
          value: -5,
          error: "totalPinnedCids must be a non-negative number",
        },
        {
          field: "collectedAt",
          value: 123,
          error: "collectedAt must be a string",
        },
        {
          field: "signature",
          value: "not array",
          error: "signature must be an array",
        },
      ];

      for (const test of testCases) {
        const invalid = { ...validMetrics, [test.field]: test.value };
        const result = validateMetricsStructure(invalid);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(test.error);
      }
    });

    it("should validate ISO date format", () => {
      const invalidDates = [
        "not a date",
        "2024-13-01T00:00:00.000Z", // Invalid month
        "2024-01-32T00:00:00.000Z", // Invalid day
        "2024/01/01", // Wrong format
      ];

      for (const date of invalidDates) {
        const invalid = { ...validMetrics, collectedAt: date };
        const result = validateMetricsStructure(invalid);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(
          "collectedAt must be a valid ISO date string",
        );
      }
    });

    it("should validate signature array contains bytes", () => {
      const invalidSignatures = [
        [256, 0, 0], // Value > 255
        [-1, 0, 0], // Negative value
        [1.5, 2, 3], // Float value
        ["1", "2", "3"], // String values
        [1, null, 3], // Null value
      ];

      for (const sig of invalidSignatures) {
        const invalid = { ...validMetrics, signature: sig };
        const result = validateMetricsStructure(invalid);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(
          "signature must be an array of bytes (numbers 0-255)",
        );
      }
    });

    it("should accept valid signatures", () => {
      const validSignatures = [
        [0, 128, 255], // Min, mid, max values
        [], // Empty array (handled separately in signature validation)
        Array(64).fill(0), // Typical signature length
      ];

      for (const sig of validSignatures) {
        const metrics = { ...validMetrics, signature: sig };
        const result = validateMetricsStructure(metrics);
        expect(result.isValid).toBe(true);
      }
    });

    it("should accept all valid environments", () => {
      const environments = ["testnet", "mainnet", "local"];

      for (const env of environments) {
        const metrics = { ...validMetrics, environment: env };
        const result = validateMetricsStructure(metrics);
        expect(result.isValid).toBe(true);
      }
    });
  });
});
