import { describe, it, expect } from "vitest";
import {
  internalToWire,
  wireToInternal,
  extractSignableData,
  wireToStorage,
  createWireFormat,
  isValidWireFormat,
  isValidInternalFormat,
  cloneMetrics,
} from "../src/transformations.js";
import type {
  NodeMetricsInternal,
  NodeMetricsWire,
  NodeMetricsSignable,
} from "../src/types.js";

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

  const sampleWire: NodeMetricsWire = {
    ipfsPeerId: "12D3KooWIPFS",
    ceramicPeerId: "12D3KooWCeramic",
    environment: "testnet",
    totalStreams: 42,
    totalPinnedCids: 24,
    collectedAt: "2024-01-01T00:00:00.000Z",
    signature: [1, 2, 3, 4, 5],
  };

  describe("internalToWire", () => {
    it("should transform internal format to wire format", () => {
      const wire = internalToWire(sampleInternal);

      expect(wire.ipfsPeerId).toBe(sampleInternal.identity.ipfs);
      expect(wire.ceramicPeerId).toBe(sampleInternal.identity.ceramic);
      expect(wire.environment).toBe(sampleInternal.environment);
      expect(wire.totalStreams).toBe(sampleInternal.summary.totalStreams);
      expect(wire.totalPinnedCids).toBe(sampleInternal.summary.totalPinnedCids);
      expect(wire.collectedAt).toBe(sampleInternal.summary.collectedAt);
      expect(wire.signature).toEqual(sampleInternal.signature);
    });

    it("should flatten nested structure", () => {
      const wire = internalToWire(sampleInternal);

      expect(wire).not.toHaveProperty("identity");
      expect(wire).not.toHaveProperty("summary");
      expect(wire).toHaveProperty("ipfsPeerId");
      expect(wire).toHaveProperty("totalStreams");
    });
  });

  describe("wireToInternal", () => {
    it("should transform wire format back to internal format", () => {
      const internal = wireToInternal(sampleWire);

      expect(internal.identity.ipfs).toBe(sampleWire.ipfsPeerId);
      expect(internal.identity.ceramic).toBe(sampleWire.ceramicPeerId);
      expect(internal.environment).toBe(sampleWire.environment);
      expect(internal.summary.totalStreams).toBe(sampleWire.totalStreams);
      expect(internal.summary.totalPinnedCids).toBe(sampleWire.totalPinnedCids);
      expect(internal.summary.collectedAt).toBe(sampleWire.collectedAt);
      expect(internal.signature).toEqual(sampleWire.signature);
    });

    it("should recreate nested structure", () => {
      const internal = wireToInternal(sampleWire);

      expect(internal).toHaveProperty("identity");
      expect(internal).toHaveProperty("summary");
      expect(internal.identity).toHaveProperty("ipfs");
      expect(internal.summary).toHaveProperty("totalStreams");
    });

    it("should be inverse of internalToWire", () => {
      const wire = internalToWire(sampleInternal);
      const backToInternal = wireToInternal(wire);

      expect(backToInternal).toEqual(sampleInternal);
    });
  });

  describe("extractSignableData", () => {
    it("should extract signable data by removing signature", () => {
      const signable = extractSignableData(sampleWire);

      expect(signable).not.toHaveProperty("signature");
      expect(signable.ipfsPeerId).toBe(sampleWire.ipfsPeerId);
      expect(signable.totalStreams).toBe(sampleWire.totalStreams);
    });

    it("should not modify the original wire object", () => {
      const originalSig = [...sampleWire.signature];
      extractSignableData(sampleWire);

      expect(sampleWire.signature).toEqual(originalSig);
    });
  });

  describe("wireToStorage", () => {
    it("should convert wire format to storage format", () => {
      const storage = wireToStorage(sampleWire);

      expect(storage).not.toHaveProperty("signature");
      expect(storage.ipfsPeerId).toBe(sampleWire.ipfsPeerId);
      expect(storage.environment).toBe(sampleWire.environment);
      expect(storage.totalStreams).toBe(sampleWire.totalStreams);
    });
  });

  describe("createWireFormat", () => {
    it("should create wire format from signable data and signature", () => {
      const signable: NodeMetricsSignable = {
        ipfsPeerId: "peer123",
        ceramicPeerId: "ceramic456",
        environment: "mainnet",
        totalStreams: 10,
        totalPinnedCids: 5,
        collectedAt: "2024-01-01T00:00:00.000Z",
      };
      const signature = [9, 8, 7, 6, 5];

      const wire = createWireFormat(signable, signature);

      expect(wire.ipfsPeerId).toBe(signable.ipfsPeerId);
      expect(wire.signature).toEqual(signature);
      expect(wire).toHaveProperty("signature");
    });
  });

  describe("isValidWireFormat", () => {
    it("should validate correct wire format", () => {
      expect(isValidWireFormat(sampleWire)).toBe(true);
    });

    it("should reject invalid formats", () => {
      expect(isValidWireFormat(null)).toBe(false);
      expect(isValidWireFormat(undefined)).toBe(false);
      expect(isValidWireFormat({})).toBe(false);
      expect(isValidWireFormat("string")).toBe(false);
      expect(isValidWireFormat(123)).toBe(false);
    });

    it("should reject missing required fields", () => {
      const incomplete = { ...sampleWire };
      delete (incomplete as any).ipfsPeerId;
      expect(isValidWireFormat(incomplete)).toBe(false);
    });

    it("should reject wrong field types", () => {
      const wrongType = { ...sampleWire, totalStreams: "not a number" };
      expect(isValidWireFormat(wrongType)).toBe(false);
    });

    it("should reject invalid environment values", () => {
      const badEnv = { ...sampleWire, environment: "production" };
      expect(isValidWireFormat(badEnv)).toBe(false);
    });

    it("should reject invalid signature format", () => {
      const badSig1 = { ...sampleWire, signature: "not an array" };
      expect(isValidWireFormat(badSig1)).toBe(false);

      const badSig2 = { ...sampleWire, signature: [1, "two", 3] };
      expect(isValidWireFormat(badSig2)).toBe(false);
    });
  });

  describe("isValidInternalFormat", () => {
    it("should validate correct internal format", () => {
      expect(isValidInternalFormat(sampleInternal)).toBe(true);
    });

    it("should reject flat structure", () => {
      expect(isValidInternalFormat(sampleWire)).toBe(false);
    });

    it("should reject missing nested structures", () => {
      const noIdentity = { ...sampleInternal, identity: null };
      expect(isValidInternalFormat(noIdentity)).toBe(false);

      const noSummary = { ...sampleInternal, summary: null };
      expect(isValidInternalFormat(noSummary)).toBe(false);
    });

    it("should reject incomplete nested structures", () => {
      const incompleteIdentity = {
        ...sampleInternal,
        identity: { ipfs: "peer123" }, // Missing ceramic
      };
      expect(isValidInternalFormat(incompleteIdentity)).toBe(false);
    });
  });

  describe("cloneMetrics", () => {
    it("should create a deep copy of metrics", () => {
      const clone = cloneMetrics(sampleInternal);

      expect(clone).toEqual(sampleInternal);
      expect(clone).not.toBe(sampleInternal);
      expect(clone.identity).not.toBe(sampleInternal.identity);
      expect(clone.summary).not.toBe(sampleInternal.summary);
      expect(clone.signature).not.toBe(sampleInternal.signature);
    });

    it("should prevent mutations from affecting the original", () => {
      const clone = cloneMetrics(sampleInternal);

      clone.environment = "mainnet";
      clone.identity.ipfs = "modified";
      clone.summary.totalStreams = 999;
      clone.signature[0] = 999;

      expect(sampleInternal.environment).toBe("testnet");
      expect(sampleInternal.identity.ipfs).toBe("12D3KooWIPFS");
      expect(sampleInternal.summary.totalStreams).toBe(42);
      expect(sampleInternal.signature[0]).toBe(1);
    });

    it("should work with wire format", () => {
      const clone = cloneMetrics(sampleWire);

      expect(clone).toEqual(sampleWire);
      expect(clone).not.toBe(sampleWire);

      clone.totalStreams = 999;
      expect(sampleWire.totalStreams).toBe(42);
    });
  });
});
