import { describe, it, expect } from "vitest";
import {
  extractSignableData,
  createInternalFormat,
  isValidInternalFormat,
  cloneMetrics,
} from "../src/transformations.js";
import type { NodeMetricsInternal, NodeMetricsSignable } from "../src/types.js";

describe("Transformations", () => {
  const sampleInternal: NodeMetricsInternal = {
    identity: {
      ipfs: "12D3KooWIPFS",
      ceramic: "12D3KooWCeramic",
    },
    environment: "testnet",
    summary: {
      totalStreams: 42,
      totalPinnedCids: 24,
      collectedAt: "2024-01-01T00:00:00.000Z",
    },
    signature: [1, 2, 3, 4, 5],
  };

  const sampleSignable: NodeMetricsSignable = {
    ipfsPeerId: "12D3KooWIPFS",
    ceramicPeerId: "12D3KooWCeramic",
    environment: "testnet",
    totalStreams: 42,
    totalPinnedCids: 24,
    collectedAt: "2024-01-01T00:00:00.000Z",
  };

  describe("extractSignableData", () => {
    it("should extract signable data by removing signature and flattening structure", () => {
      const signable = extractSignableData(sampleInternal);

      expect(signable.ipfsPeerId).toBe(sampleInternal.identity.ipfs);
      expect(signable.ceramicPeerId).toBe(sampleInternal.identity.ceramic);
      expect(signable.environment).toBe(sampleInternal.environment);
      expect(signable.totalStreams).toBe(sampleInternal.summary.totalStreams);
      expect(signable.totalPinnedCids).toBe(
        sampleInternal.summary.totalPinnedCids,
      );
      expect(signable.collectedAt).toBe(sampleInternal.summary.collectedAt);
    });

    it("should not include signature in signable data", () => {
      const signable = extractSignableData(sampleInternal);
      expect(signable).not.toHaveProperty("signature");
    });

    it("should not modify the original internal object", () => {
      const original = { ...sampleInternal };
      extractSignableData(sampleInternal);
      expect(sampleInternal).toEqual(original);
    });
  });

  describe("createInternalFormat", () => {
    it("should create internal format from signable data and signature", () => {
      const signature = [9, 8, 7, 6, 5];
      const internal = createInternalFormat(sampleSignable, signature);

      expect(internal.identity.ipfs).toBe(sampleSignable.ipfsPeerId);
      expect(internal.identity.ceramic).toBe(sampleSignable.ceramicPeerId);
      expect(internal.environment).toBe(sampleSignable.environment);
      expect(internal.summary.totalStreams).toBe(sampleSignable.totalStreams);
      expect(internal.summary.totalPinnedCids).toBe(
        sampleSignable.totalPinnedCids,
      );
      expect(internal.summary.collectedAt).toBe(sampleSignable.collectedAt);
      expect(internal.signature).toEqual(signature);
    });

    it("should create nested structure", () => {
      const signature = [1, 2, 3];
      const internal = createInternalFormat(sampleSignable, signature);

      expect(internal).toHaveProperty("identity");
      expect(internal).toHaveProperty("summary");
      expect(internal.identity).toHaveProperty("ipfs");
      expect(internal.identity).toHaveProperty("ceramic");
      expect(internal.summary).toHaveProperty("totalStreams");
      expect(internal.summary).toHaveProperty("totalPinnedCids");
      expect(internal.summary).toHaveProperty("collectedAt");
    });

    it("should be inverse of extractSignableData", () => {
      const signable = extractSignableData(sampleInternal);
      const backToInternal = createInternalFormat(
        signable,
        sampleInternal.signature,
      );

      expect(backToInternal).toEqual(sampleInternal);
    });
  });

  describe("isValidInternalFormat", () => {
    it("should validate correct internal format", () => {
      expect(isValidInternalFormat(sampleInternal)).toBe(true);
    });

    it("should reject invalid formats", () => {
      expect(isValidInternalFormat(null)).toBe(false);
      expect(isValidInternalFormat(undefined)).toBe(false);
      expect(isValidInternalFormat("string")).toBe(false);
      expect(isValidInternalFormat(123)).toBe(false);
      expect(isValidInternalFormat([])).toBe(false);
    });

    it("should reject missing required fields", () => {
      const missingIdentity = { ...sampleInternal };
      delete (missingIdentity as Record<string, unknown>).identity;
      expect(isValidInternalFormat(missingIdentity)).toBe(false);

      const missingSummary = { ...sampleInternal };
      delete (missingSummary as Record<string, unknown>).summary;
      expect(isValidInternalFormat(missingSummary)).toBe(false);

      const missingSignature = { ...sampleInternal };
      delete (missingSignature as Record<string, unknown>).signature;
      expect(isValidInternalFormat(missingSignature)).toBe(false);
    });

    it("should reject wrong field types", () => {
      const badIdentity = { ...sampleInternal, identity: "not an object" };
      expect(isValidInternalFormat(badIdentity)).toBe(false);

      const badSummary = { ...sampleInternal, summary: "not an object" };
      expect(isValidInternalFormat(badSummary)).toBe(false);

      const badEnvironment = { ...sampleInternal, environment: "invalid" };
      expect(isValidInternalFormat(badEnvironment)).toBe(false);
    });

    it("should reject invalid signature format", () => {
      const badSig1 = { ...sampleInternal, signature: "not array" };
      expect(isValidInternalFormat(badSig1)).toBe(false);

      const badSig2 = { ...sampleInternal, signature: [1, "two", 3] };
      expect(isValidInternalFormat(badSig2)).toBe(false);
    });
  });

  describe("cloneMetrics", () => {
    it("should create deep copy of internal metrics", () => {
      const cloned = cloneMetrics(sampleInternal);

      expect(cloned).toEqual(sampleInternal);
      expect(cloned).not.toBe(sampleInternal);
      expect(cloned.identity).not.toBe(sampleInternal.identity);
      expect(cloned.summary).not.toBe(sampleInternal.summary);
      expect(cloned.signature).not.toBe(sampleInternal.signature);
    });

    it("should create deep copy of signable metrics", () => {
      const cloned = cloneMetrics(sampleSignable);

      expect(cloned).toEqual(sampleSignable);
      expect(cloned).not.toBe(sampleSignable);
    });

    it("should prevent mutations on the original", () => {
      const cloned = cloneMetrics(sampleInternal);
      cloned.identity.ipfs = "modified";
      cloned.summary.totalStreams = 999;

      expect(sampleInternal.identity.ipfs).toBe("12D3KooWIPFS");
      expect(sampleInternal.summary.totalStreams).toBe(42);
    });
  });
});
