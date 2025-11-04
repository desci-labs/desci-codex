import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMetricsService } from "../src/metrics.js";
import { metricsToPayload } from "../src/metrics-pusher.js";
import { NodeMetricsGranularSchema } from "@desci-labs/desci-codex-metrics";
import type { CeramicEventsService, CeramicNodeStats } from "../src/events.js";
import type { IPFSNode } from "../src/ipfs.js";
import { peerIdFromPrivateKey } from "@libp2p/peer-id";
import { generateKeyPair } from "@libp2p/crypto/keys";
import { Ed25519PrivateKey, PeerId } from "@libp2p/interface";

/**
 * API contract tests to ensure node package remains compatible with \@desci-labs/desci-codex-metrics.
 * Focuses on schema compatibility and format expectations.
 * Cryptographic validation is thoroughly tested in \@desci-labs/desci-codex-metrics library.
 */
describe("Metrics API Contract", () => {
  let mockEventsService: CeramicEventsService;
  let mockIpfsNode: IPFSNode;
  let privateKey: Ed25519PrivateKey;
  let peerId: PeerId;

  beforeEach(async () => {
    privateKey = await generateKeyPair("Ed25519");
    peerId = peerIdFromPrivateKey(privateKey);

    mockEventsService = {
      start: vi.fn(),
      stop: vi.fn(),
      stats: vi.fn().mockResolvedValue({
        peerId: peerId.toString(),
        streams: [{ id: "stream1", versions: ["v1", "v2"] }],
      } satisfies CeramicNodeStats),
    } satisfies CeramicEventsService;

    mockIpfsNode = {
      start: vi.fn(),
      stop: vi.fn(),
      getFile: vi.fn(),
      pinFile: vi.fn(),
      unpinFile: vi.fn(),
      listPins: vi.fn().mockResolvedValue(["cid1", "cid2"]),
      reprovide: vi.fn(),
      libp2pInfo: vi.fn().mockResolvedValue({
        peerId: peerId.toString(),
        multiaddrs: ["/ip4/127.0.0.1/tcp/4001"],
      }),
      getPrivateKey: vi.fn().mockResolvedValue(privateKey),
    };
  });

  describe("Schema Compliance", () => {
    it("should produce metrics compatible with NodeMetricsGranularSchema", async () => {
      const metricsService = createMetricsService({
        eventsService: mockEventsService,
        ipfsNode: mockIpfsNode,
        environment: "testnet",
        privateKey,
      });

      const metrics = await metricsService.getMetrics();
      const payload = metricsToPayload(metrics);

      // This will throw if the schema doesn't match
      expect(() => NodeMetricsGranularSchema.parse(payload)).not.toThrow();

      // Verify structure matches expected granular contract
      const parsed = NodeMetricsGranularSchema.parse(payload);
      expect(parsed.peerId).toBe(peerId.toString());
      expect(parsed.nodeId).toBe(peerId.toString());
      expect(parsed.environment).toBe("testnet");
      expect(parsed.manifests).toHaveLength(2); // 2 pinned CIDs
      expect(parsed.streams).toHaveLength(1); // 1 stream
      expect(parsed.streams[0].eventIds).toHaveLength(2); // 2 versions/events
      expect(parsed.signature).toBeInstanceOf(Array);
    });

    it("should support all required environments", async () => {
      const environments = ["testnet", "mainnet", "local"] as const;

      for (const environment of environments) {
        const metricsService = createMetricsService({
          eventsService: mockEventsService,
          ipfsNode: mockIpfsNode,
          environment,
          privateKey,
        });

        const metrics = await metricsService.getMetrics();

        // Schema validation should pass for all environments
        expect(() => NodeMetricsGranularSchema.parse(metrics)).not.toThrow();
        expect(metrics.environment).toBe(environment);
      }
    });
  });

  describe("Data Format Contract", () => {
    it("should maintain expected granular structure for metrics_server processing", async () => {
      const metricsService = createMetricsService({
        eventsService: mockEventsService,
        ipfsNode: mockIpfsNode,
        environment: "local",
        privateKey,
      });

      const metrics = await metricsService.getMetrics();

      // Verify structure matches what granular metrics_server expects
      expect(metrics).toHaveProperty("nodeId");
      expect(metrics).toHaveProperty("peerId");
      expect(metrics).toHaveProperty("environment");
      expect(metrics).toHaveProperty("manifests");
      expect(metrics).toHaveProperty("streams");
      expect(metrics).toHaveProperty("collectedAt");
      expect(metrics).toHaveProperty("signature");

      // Verify types for safe processing
      expect(typeof metrics.nodeId).toBe("string");
      expect(typeof metrics.peerId).toBe("string");
      expect(typeof metrics.environment).toBe("string");
      expect(Array.isArray(metrics.manifests)).toBe(true);
      expect(Array.isArray(metrics.streams)).toBe(true);
      expect(typeof metrics.collectedAt).toBe("string");
      expect(Array.isArray(metrics.signature)).toBe(true);

      // Verify granular structure details
      if (metrics.manifests.length > 0) {
        expect(typeof metrics.manifests[0]).toBe("string");
      }

      if (metrics.streams.length > 0) {
        expect(metrics.streams[0]).toHaveProperty("streamId");
        expect(metrics.streams[0]).toHaveProperty("streamCid");
        expect(metrics.streams[0]).toHaveProperty("eventIds");
        expect(Array.isArray(metrics.streams[0].eventIds)).toBe(true);
      }
    });

    it("should produce valid ISO timestamp", async () => {
      const metricsService = createMetricsService({
        eventsService: mockEventsService,
        ipfsNode: mockIpfsNode,
        environment: "testnet",
        privateKey,
      });

      const metrics = await metricsService.getMetrics();

      // Verify timestamp is valid ISO string
      expect(() => new Date(metrics.collectedAt)).not.toThrow();
      expect(new Date(metrics.collectedAt).toISOString()).toBe(
        metrics.collectedAt,
      );
    });
  });
});
