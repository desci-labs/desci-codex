import { describe, it, expect } from "vitest";
import {
  NodeMetricsWireSchema,
  NodeMetricsInternalSchema,
  NodeMetricsSignableSchema,
  EnvironmentSchema,
  SignatureSchema,
} from "../src/schemas.js";

describe("Zod Schemas", () => {
  describe("EnvironmentSchema", () => {
    it("should validate valid environments", () => {
      expect(EnvironmentSchema.parse("testnet")).toBe("testnet");
      expect(EnvironmentSchema.parse("mainnet")).toBe("mainnet");
      expect(EnvironmentSchema.parse("local")).toBe("local");
    });

    it("should reject invalid environments", () => {
      expect(() => EnvironmentSchema.parse("production")).toThrow();
      expect(() => EnvironmentSchema.parse("dev")).toThrow();
      expect(() => EnvironmentSchema.parse("")).toThrow();
    });
  });

  describe("SignatureSchema", () => {
    it("should validate valid signature arrays", () => {
      expect(SignatureSchema.parse([0, 128, 255])).toEqual([0, 128, 255]);
      expect(SignatureSchema.parse([])).toEqual([]);
      expect(SignatureSchema.parse(Array(64).fill(0))).toEqual(
        Array(64).fill(0),
      );
    });

    it("should reject invalid signatures", () => {
      expect(() => SignatureSchema.parse([-1, 0, 0])).toThrow();
      expect(() => SignatureSchema.parse([256, 0, 0])).toThrow();
      expect(() => SignatureSchema.parse([1.5, 2, 3])).toThrow();
      expect(() => SignatureSchema.parse(["1", "2", "3"])).toThrow();
      expect(() => SignatureSchema.parse("not an array")).toThrow();
    });
  });

  describe("NodeMetricsSignableSchema", () => {
    const validSignableData = {
      ipfsPeerId: "12D3KooWExample",
      ceramicPeerId: "12D3KooWCeramic",
      environment: "testnet" as const,
      totalStreams: 42,
      totalPinnedCids: 24,
      collectedAt: "2024-01-01T00:00:00.000Z",
    };

    it("should validate valid signable data", () => {
      const result = NodeMetricsSignableSchema.parse(validSignableData);
      expect(result).toEqual(validSignableData);
    });

    it("should require all fields", () => {
      const incomplete = { ...validSignableData };
      delete (incomplete as any).ipfsPeerId;
      expect(() => NodeMetricsSignableSchema.parse(incomplete)).toThrow();
    });

    it("should validate field types", () => {
      const invalidTypes = [
        { ...validSignableData, ipfsPeerId: "" },
        { ...validSignableData, totalStreams: -1 },
        { ...validSignableData, totalPinnedCids: "not a number" },
        { ...validSignableData, environment: "invalid" },
        { ...validSignableData, collectedAt: "not a date" },
      ];

      for (const invalid of invalidTypes) {
        expect(() => NodeMetricsSignableSchema.parse(invalid)).toThrow();
      }
    });

    it("should validate ISO date strings", () => {
      const validDates = [
        "2024-01-01T00:00:00.000Z",
        "2024-12-31T23:59:59.999Z",
        "2024-06-15T12:30:45.123Z",
      ];

      for (const date of validDates) {
        const data = { ...validSignableData, collectedAt: date };
        expect(() => NodeMetricsSignableSchema.parse(data)).not.toThrow();
      }

      const invalidDates = [
        "not a date",
        "2024-13-01T00:00:00.000Z",
        "2024-01-32T00:00:00.000Z",
        "2024/01/01",
      ];

      for (const date of invalidDates) {
        const data = { ...validSignableData, collectedAt: date };
        expect(() => NodeMetricsSignableSchema.parse(data)).toThrow();
      }
    });
  });

  describe("NodeMetricsWireSchema", () => {
    const validWireData = {
      ipfsPeerId: "12D3KooWExample",
      ceramicPeerId: "12D3KooWCeramic",
      environment: "mainnet" as const,
      totalStreams: 100,
      totalPinnedCids: 50,
      collectedAt: "2024-01-01T00:00:00.000Z",
      signature: [1, 2, 3, 4, 5],
    };

    it("should validate valid wire data", () => {
      const result = NodeMetricsWireSchema.parse(validWireData);
      expect(result).toEqual(validWireData);
    });

    it("should include signature validation", () => {
      const invalidSigs = [
        { ...validWireData, signature: "not an array" },
        { ...validWireData, signature: [-1, 0, 0] },
        { ...validWireData, signature: [256, 0, 0] },
        { ...validWireData, signature: [1.5, 2, 3] },
      ];

      for (const invalid of invalidSigs) {
        expect(() => NodeMetricsWireSchema.parse(invalid)).toThrow();
      }
    });
  });

  describe("NodeMetricsInternalSchema", () => {
    const validInternalData = {
      identity: {
        ipfs: "12D3KooWIPFS",
        ceramic: "12D3KooWCeramic",
      },
      environment: "local" as const,
      summary: {
        totalStreams: 42,
        totalPinnedCids: 24,
        collectedAt: "2024-01-01T00:00:00.000Z",
      },
      signature: [1, 2, 3, 4, 5],
    };

    it("should validate valid internal data", () => {
      const result = NodeMetricsInternalSchema.parse(validInternalData);
      expect(result).toEqual(validInternalData);
    });

    it("should require nested structure", () => {
      const flatData = {
        ipfsPeerId: "12D3KooWIPFS",
        ceramicPeerId: "12D3KooWCeramic",
        environment: "local",
        totalStreams: 42,
        totalPinnedCids: 24,
        collectedAt: "2024-01-01T00:00:00.000Z",
        signature: [1, 2, 3, 4, 5],
      };

      expect(() => NodeMetricsInternalSchema.parse(flatData)).toThrow();
    });

    it("should validate nested objects", () => {
      const invalidNested = [
        { ...validInternalData, identity: null },
        { ...validInternalData, summary: null },
        { ...validInternalData, identity: { ipfs: "test" } }, // missing ceramic
        { ...validInternalData, summary: { totalStreams: 42 } }, // missing other fields
      ];

      for (const invalid of invalidNested) {
        expect(() => NodeMetricsInternalSchema.parse(invalid)).toThrow();
      }
    });
  });

  describe("Schema type inference", () => {
    it("should infer correct TypeScript types", () => {
      const wireData = NodeMetricsWireSchema.parse({
        ipfsPeerId: "peer123",
        ceramicPeerId: "ceramic456",
        environment: "testnet",
        totalStreams: 10,
        totalPinnedCids: 5,
        collectedAt: "2024-01-01T00:00:00.000Z",
        signature: [1, 2, 3],
      });

      // TypeScript should infer these types correctly
      const peerId: string = wireData.ipfsPeerId;
      const env: "testnet" | "mainnet" | "local" = wireData.environment;
      const streams: number = wireData.totalStreams;
      const sig: number[] = wireData.signature;

      expect(peerId).toBe("peer123");
      expect(env).toBe("testnet");
      expect(streams).toBe(10);
      expect(sig).toEqual([1, 2, 3]);
    });
  });
});
