import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMetricsService } from "../src/metrics.js";
import { metricsToPayload } from "../src/metrics-pusher.js";
import { NodeMetricsInternalSchema } from "@codex/metrics";
import type { CeramicEventsService, CeramicNodeStats } from "../src/events.js";
import type { IPFSNode } from "../src/ipfs.js";
import { peerIdFromPrivateKey } from "@libp2p/peer-id";
import { generateKeyPair } from "@libp2p/crypto/keys";
import { Ed25519PrivateKey, PeerId } from "@libp2p/interface";

/**
 * API contract tests to ensure node package remains compatible with \@codex/metrics.
 * Focuses on schema compatibility and format expectations.
 * Cryptographic validation is thoroughly tested in \@codex/metrics library.
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
    it("should produce metrics compatible with NodeMetricsInternalSchema", async () => {
      const metricsService = createMetricsService({
        eventsService: mockEventsService,
        ipfsNode: mockIpfsNode,
        environment: "testnet",
        privateKey,
      });

      const metrics = await metricsService.getMetrics();
      const payload = metricsToPayload(metrics);

      // This will throw if the schema doesn't match
      expect(() => NodeMetricsInternalSchema.parse(payload)).not.toThrow();

      // Verify structure matches expected contract
      const parsed = NodeMetricsInternalSchema.parse(payload);
      expect(parsed.identity.ipfs).toBe(peerId.toString());
      expect(parsed.environment).toBe("testnet");
      expect(parsed.summary.totalStreams).toBe(1);
      expect(parsed.summary.totalPinnedCids).toBe(2);
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
        expect(() => NodeMetricsInternalSchema.parse(metrics)).not.toThrow();
        expect(metrics.environment).toBe(environment);
      }
    });
  });

  describe("Data Format Contract", () => {
    it("should maintain expected structure for metrics_server processing", async () => {
      const metricsService = createMetricsService({
        eventsService: mockEventsService,
        ipfsNode: mockIpfsNode,
        environment: "local",
        privateKey,
      });

      const metrics = await metricsService.getMetrics();

      // Verify structure matches what metrics_server expects
      expect(metrics).toHaveProperty("identity");
      expect(metrics).toHaveProperty("environment");
      expect(metrics).toHaveProperty("summary");
      expect(metrics).toHaveProperty("signature");

      expect(metrics.identity).toHaveProperty("ipfs");
      expect(metrics.identity).toHaveProperty("ceramic");
      expect(metrics.summary).toHaveProperty("totalStreams");
      expect(metrics.summary).toHaveProperty("totalPinnedCids");
      expect(metrics.summary).toHaveProperty("collectedAt");

      // Verify types for safe processing
      expect(typeof metrics.identity.ipfs).toBe("string");
      expect(typeof metrics.identity.ceramic).toBe("string");
      expect(typeof metrics.environment).toBe("string");
      expect(typeof metrics.summary.totalStreams).toBe("number");
      expect(typeof metrics.summary.totalPinnedCids).toBe("number");
      expect(typeof metrics.summary.collectedAt).toBe("string");
      expect(Array.isArray(metrics.signature)).toBe(true);
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
      expect(() => new Date(metrics.summary.collectedAt)).not.toThrow();
      expect(new Date(metrics.summary.collectedAt).toISOString()).toBe(
        metrics.summary.collectedAt,
      );
    });
  });
});
