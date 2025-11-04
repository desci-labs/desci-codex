import { describe, it, expect } from "vitest";
import {
  extractSignableData,
  createInternalFormat,
  isValidInternalFormat,
  cloneMetrics,
} from "../src/transformations.js";
import type { NodeMetricsGranular, NodeMetricsSignable } from "../src/types.js";

describe("Transformations", () => {
  const sampleGranular: NodeMetricsGranular = {
    nodeId: "node-12D3KooW",
    ceramicPeerId: "12D3KooWIPFS",
    environment: "testnet",
    manifests: [
      "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
      "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    ],
    streams: [
      {
        streamId: "stream1",
        streamCid:
          "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        eventIds: ["event1", "event2"],
      },
    ],
    collectedAt: "2024-01-01T00:00:00.000Z",
    signature: [1, 2, 3, 4, 5],
  };

  const sampleSignable: NodeMetricsSignable = {
    nodeId: "node-12D3KooW",
    ceramicPeerId: "12D3KooWIPFS",
    environment: "testnet",
    manifests: [
      "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
      "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    ],
    streams: [
      {
        streamId: "stream1",
        streamCid:
          "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        eventIds: ["event1", "event2"],
      },
    ],
    collectedAt: "2024-01-01T00:00:00.000Z",
  };

  describe("extractSignableData", () => {
    it("should extract signable data by removing signature", () => {
      const signable = extractSignableData(sampleGranular);

      expect(signable.nodeId).toBe(sampleGranular.nodeId);
      expect(signable.ceramicPeerId).toBe(sampleGranular.ceramicPeerId);
      expect(signable.environment).toBe(sampleGranular.environment);
      expect(signable.manifests).toEqual(sampleGranular.manifests);
      expect(signable.streams).toEqual(sampleGranular.streams);
      expect(signable.collectedAt).toBe(sampleGranular.collectedAt);
    });

    it("should not include signature in signable data", () => {
      const signable = extractSignableData(sampleGranular);
      expect(signable).not.toHaveProperty("signature");
    });

    it("should not modify the original granular object", () => {
      const original = { ...sampleGranular };
      extractSignableData(sampleGranular);
      expect(sampleGranular).toEqual(original);
    });
  });

  describe("createInternalFormat", () => {
    it("should create granular format from signable data and signature", () => {
      const signature = [9, 8, 7, 6, 5];
      const granular = createInternalFormat(sampleSignable, signature);

      expect(granular.nodeId).toBe(sampleSignable.nodeId);
      expect(granular.ceramicPeerId).toBe(sampleSignable.ceramicPeerId);
      expect(granular.environment).toBe(sampleSignable.environment);
      expect(granular.manifests).toEqual(sampleSignable.manifests);
      expect(granular.streams).toEqual(sampleSignable.streams);
      expect(granular.collectedAt).toBe(sampleSignable.collectedAt);
      expect(granular.signature).toEqual(signature);
    });

    it("should preserve arrays and structure", () => {
      const signature = [1, 2, 3];
      const granular = createInternalFormat(sampleSignable, signature);

      expect(granular).toHaveProperty("nodeId");
      expect(granular).toHaveProperty("ceramicPeerId");
      expect(granular).toHaveProperty("manifests");
      expect(granular).toHaveProperty("streams");
      expect(Array.isArray(granular.manifests)).toBe(true);
      expect(Array.isArray(granular.streams)).toBe(true);
      expect(granular.streams[0]).toHaveProperty("streamId");
      expect(granular.streams[0]).toHaveProperty("streamCid");
      expect(granular.streams[0]).toHaveProperty("eventIds");
    });

    it("should be inverse of extractSignableData", () => {
      const signable = extractSignableData(sampleGranular);
      const backToGranular = createInternalFormat(
        signable,
        sampleGranular.signature,
      );

      expect(backToGranular).toEqual(sampleGranular);
    });
  });

  describe("isValidInternalFormat", () => {
    it("should validate correct granular format", () => {
      expect(isValidInternalFormat(sampleGranular)).toBe(true);
    });

    it("should reject invalid formats", () => {
      expect(isValidInternalFormat(null)).toBe(false);
      expect(isValidInternalFormat(undefined)).toBe(false);
      expect(isValidInternalFormat("string")).toBe(false);
      expect(isValidInternalFormat(123)).toBe(false);
      expect(isValidInternalFormat([])).toBe(false);
    });

    it("should reject missing required fields", () => {
      const missingNodeId = { ...sampleGranular };
      delete (missingNodeId as Record<string, unknown>).nodeId;
      expect(isValidInternalFormat(missingNodeId)).toBe(false);

      const missingPeerId = { ...sampleGranular };
      delete (missingPeerId as Record<string, unknown>).ceramicPeerId;
      expect(isValidInternalFormat(missingPeerId)).toBe(false);

      const missingSignature = { ...sampleGranular };
      delete (missingSignature as Record<string, unknown>).signature;
      expect(isValidInternalFormat(missingSignature)).toBe(false);
    });

    it("should reject wrong field types", () => {
      const badManifests = { ...sampleGranular, manifests: "not an array" };
      expect(isValidInternalFormat(badManifests)).toBe(false);

      const badStreams = { ...sampleGranular, streams: "not an array" };
      expect(isValidInternalFormat(badStreams)).toBe(false);

      const badEnvironment = { ...sampleGranular, environment: "invalid" };
      expect(isValidInternalFormat(badEnvironment)).toBe(false);
    });

    it("should reject invalid signature format", () => {
      const badSig1 = { ...sampleGranular, signature: "not array" };
      expect(isValidInternalFormat(badSig1)).toBe(false);

      const badSig2 = { ...sampleGranular, signature: [1, "two", 3] };
      expect(isValidInternalFormat(badSig2)).toBe(false);
    });
  });

  describe("cloneMetrics", () => {
    it("should create deep copy of granular metrics", () => {
      const cloned = cloneMetrics(sampleGranular);

      expect(cloned).toEqual(sampleGranular);
      expect(cloned).not.toBe(sampleGranular);
      expect(cloned.manifests).not.toBe(sampleGranular.manifests);
      expect(cloned.streams).not.toBe(sampleGranular.streams);
      expect(cloned.signature).not.toBe(sampleGranular.signature);
    });

    it("should create deep copy of signable metrics", () => {
      const cloned = cloneMetrics(sampleSignable);

      expect(cloned).toEqual(sampleSignable);
      expect(cloned).not.toBe(sampleSignable);
    });

    it("should prevent mutations on the original", () => {
      const cloned = cloneMetrics(sampleGranular);
      cloned.nodeId = "modified";
      cloned.manifests.push("newcid");

      expect(sampleGranular.nodeId).toBe("node-12D3KooW");
      expect(sampleGranular.manifests).toHaveLength(2);
    });
  });
});
