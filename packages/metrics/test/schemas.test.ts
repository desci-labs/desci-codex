import { describe, it, expect } from "vitest";
import {
  NodeMetricsGranularSchema,
  NodeMetricsSignableSchema,
  StreamSchema,
  EnvironmentSchema,
  SignatureSchema,
} from "../src/schemas.js";
import { newPeerIdString } from "./test-utils.js";

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

  describe("StreamSchema", () => {
    it("should validate valid stream", () => {
      const stream = {
        streamId: "stream123",
        streamCid:
          "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        eventIds: ["event1", "event2", "event3"],
      };
      expect(StreamSchema.parse(stream)).toEqual(stream);
    });

    it("should reject invalid stream", () => {
      expect(() =>
        StreamSchema.parse({ streamId: "", streamCid: "cid", eventIds: [] }),
      ).toThrow();
      expect(() =>
        StreamSchema.parse({ streamId: "id", streamCid: "", eventIds: [] }),
      ).toThrow();
      expect(() =>
        StreamSchema.parse({
          streamId: "id",
          streamCid: "cid",
          eventIds: [""],
        }),
      ).toThrow();
      expect(() =>
        StreamSchema.parse({ streamId: "id", streamCid: "cid" }),
      ).toThrow();
    });
  });

  describe("NodeMetricsSignableSchema", () => {
    it("should validate valid signable data", async () => {
      const validSignableData = {
        nodeId: await newPeerIdString(),
        ceramicPeerId: await newPeerIdString(),
        environment: "testnet" as const,
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

      const result = NodeMetricsSignableSchema.parse(validSignableData);
      expect(result).toEqual(validSignableData);
    });

    it("should require all fields", async () => {
      const validSignableData = {
        nodeId: await newPeerIdString(),
        ceramicPeerId: await newPeerIdString(),
        environment: "testnet" as const,
        manifests: [
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

      const incomplete = { ...validSignableData };
      delete (incomplete as Record<string, unknown>).nodeId;
      expect(() => NodeMetricsSignableSchema.parse(incomplete)).toThrow();
    });

    it("should validate field types", async () => {
      const nodeId = await newPeerIdString();
      const ceramicPeerId = await newPeerIdString();
      const validSignableData = {
        nodeId,
        ceramicPeerId,
        environment: "testnet" as const,
        manifests: [
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

      const invalidTypes = [
        { ...validSignableData, nodeId: "" },
        { ...validSignableData, ceramicPeerId: "" },
        { ...validSignableData, manifests: "not an array" },
        { ...validSignableData, streams: ["not a stream object"] },
        { ...validSignableData, environment: "invalid" },
        { ...validSignableData, collectedAt: "not a date" },
      ];

      for (const invalid of invalidTypes) {
        expect(() => NodeMetricsSignableSchema.parse(invalid)).toThrow();
      }
    });

    it("should validate ISO date strings", async () => {
      const nodeId = await newPeerIdString();
      const ceramicPeerId = await newPeerIdString();

      const validDates = [
        "2024-01-01T00:00:00.000Z",
        "2024-12-31T23:59:59.999Z",
        "2024-06-15T12:30:45.123Z",
      ];

      for (const date of validDates) {
        const data = {
          nodeId,
          ceramicPeerId,
          environment: "testnet" as const,
          manifests: [
            "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
          ],
          streams: [],
          collectedAt: date,
        };
        expect(() => NodeMetricsSignableSchema.parse(data)).not.toThrow();
      }

      const invalidDates = [
        "not a date",
        "2024-13-01T00:00:00.000Z",
        "2024-01-32T00:00:00.000Z",
        "2024/01/01",
      ];

      for (const date of invalidDates) {
        const data = {
          nodeId,
          ceramicPeerId,
          environment: "testnet" as const,
          manifests: [
            "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
          ],
          streams: [],
          collectedAt: date,
        };
        expect(() => NodeMetricsSignableSchema.parse(data)).toThrow();
      }
    });
  });

  describe("NodeMetricsGranularSchema", () => {
    it("should validate valid granular data", async () => {
      const validGranularData = {
        nodeId: await newPeerIdString(),
        ceramicPeerId: await newPeerIdString(),
        environment: "local" as const,
        manifests: [
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

      const result = NodeMetricsGranularSchema.parse(validGranularData);
      expect(result).toEqual(validGranularData);
    });

    it("should require all fields", async () => {
      const validGranularData = {
        nodeId: await newPeerIdString(),
        ceramicPeerId: await newPeerIdString(),
        environment: "local" as const,
        manifests: [
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

      const missingNodeId = { ...validGranularData };
      delete (missingNodeId as Record<string, unknown>).nodeId;
      expect(() => NodeMetricsGranularSchema.parse(missingNodeId)).toThrow();

      const missingSignature = { ...validGranularData };
      delete (missingSignature as Record<string, unknown>).signature;
      expect(() => NodeMetricsGranularSchema.parse(missingSignature)).toThrow();
    });

    it("should validate arrays", async () => {
      const validGranularData = {
        nodeId: await newPeerIdString(),
        ceramicPeerId: await newPeerIdString(),
        environment: "local" as const,
        manifests: [
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

      const invalidArrays = [
        { ...validGranularData, manifests: null },
        { ...validGranularData, streams: null },
        { ...validGranularData, manifests: [""] }, // invalid cid
        { ...validGranularData, streams: [{ streamId: "test" }] }, // missing fields
      ];

      for (const invalid of invalidArrays) {
        expect(() => NodeMetricsGranularSchema.parse(invalid)).toThrow();
      }
    });
  });

  describe("Schema type inference", () => {
    it("should infer correct TypeScript types", () => {
      const granularData = NodeMetricsGranularSchema.parse({
        nodeId: "node123",
        ceramicPeerId: "peer123",
        environment: "testnet",
        manifests: ["cid1"],
        streams: [
          {
            streamId: "stream1",
            streamCid: "streamCid1",
            eventIds: ["event1"],
          },
        ],
        collectedAt: "2024-01-01T00:00:00.000Z",
        signature: [1, 2, 3],
      });

      // TypeScript should infer these types correctly
      const nodeId: string = granularData.nodeId;
      const ceramicPeerId: string = granularData.ceramicPeerId;
      const env: "testnet" | "mainnet" | "local" = granularData.environment;
      const manifests: string[] = granularData.manifests;
      const sig: number[] = granularData.signature;

      expect(nodeId).toBe("node123");
      expect(ceramicPeerId).toBe("peer123");
      expect(env).toBe("testnet");
      expect(manifests[0]).toBe("cid1");
      expect(sig).toEqual([1, 2, 3]);
    });
  });
});
