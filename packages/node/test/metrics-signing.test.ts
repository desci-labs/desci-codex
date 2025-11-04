import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMetricsService } from "../src/metrics.js";
import type { CeramicEventsService, CeramicNodeStats } from "../src/events.js";
import type { IPFSNode } from "../src/ipfs.js";
import { peerIdFromPrivateKey } from "@libp2p/peer-id";
import { generateKeyPair } from "@libp2p/crypto/keys";
import { Ed25519PrivateKey, PeerId } from "@libp2p/interface";
import { metricsToPayload } from "../src/metrics-pusher.js";

/**
 * Tests for node-specific metrics collection and service integration.
 * Cryptographic validation is handled by \@desci-labs/desci-codex-metrics library tests.
 * These tests focus on service integration and data collection accuracy.
 */
describe("Node Metrics Service", () => {
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
        streams: [
          { id: "stream1", versions: ["v1", "v2"] },
          { id: "stream2", versions: ["v1"] },
        ],
      } satisfies CeramicNodeStats),
    } satisfies CeramicEventsService;

    mockIpfsNode = {
      start: vi.fn(),
      stop: vi.fn(),
      getFile: vi.fn(),
      pinFile: vi.fn(),
      unpinFile: vi.fn(),
      listPins: vi.fn().mockResolvedValue(["cid1", "cid2", "cid3"]),
      reprovide: vi.fn(),
      libp2pInfo: vi.fn().mockResolvedValue({
        peerId: peerId.toString(),
        multiaddrs: ["/ip4/127.0.0.1/tcp/4001"],
      }),
      getPrivateKey: vi.fn().mockResolvedValue(privateKey),
    };
  });

  describe("Service Creation and Data Collection", () => {
    it("should create a metrics service", () => {
      const metricsService = createMetricsService({
        eventsService: mockEventsService,
        ipfsNode: mockIpfsNode,
        environment: "testnet",
        privateKey,
      });

      expect(metricsService).toBeDefined();
      expect(typeof metricsService.getMetrics).toBe("function");
    });

    it("should collect accurate granular metrics from integrated services", async () => {
      const metricsService = createMetricsService({
        eventsService: mockEventsService,
        ipfsNode: mockIpfsNode,
        environment: "mainnet",
        privateKey,
      });

      const metrics = await metricsService.getMetrics();

      // Verify granular service integration - data comes from mocked services
      expect(metrics.peerId).toBe(peerId.toString());
      expect(metrics.nodeId).toBe(peerId.toString());
      expect(metrics.environment).toBe("mainnet");
      expect(metrics.manifests).toHaveLength(3); // From mockIpfsNode.listPins
      expect(metrics.streams).toHaveLength(2); // From mockEventsService
      expect(metrics.streams[0].eventIds).toEqual(["v1", "v2"]); // First stream versions
      expect(metrics.streams[1].eventIds).toEqual(["v1"]); // Second stream versions
      expect(metrics.collectedAt).toBeDefined();
      expect(new Date(metrics.collectedAt)).toBeInstanceOf(Date);
    });

    it("should handle different environments correctly", async () => {
      const environments = ["testnet", "mainnet", "local"] as const;

      for (const environment of environments) {
        const metricsService = createMetricsService({
          eventsService: mockEventsService,
          ipfsNode: mockIpfsNode,
          environment,
          privateKey,
        });

        const metrics = await metricsService.getMetrics();
        expect(metrics.environment).toBe(environment);
      }
    });
  });

  describe("Service Integration Accuracy", () => {
    it("should accurately reflect changes in ceramic streams", async () => {
      // Test with different stream counts
      const testCases = [
        { streams: [], expectedCount: 0 },
        { streams: [{ id: "stream1", versions: ["v1"] }], expectedCount: 1 },
        {
          streams: [
            { id: "stream1", versions: ["v1", "v2"] },
            { id: "stream2", versions: ["v1"] },
            { id: "stream3", versions: ["v1", "v2", "v3"] },
          ],
          expectedCount: 3,
        },
      ];

      for (const testCase of testCases) {
        mockEventsService.stats = vi.fn().mockResolvedValue({
          peerId: peerId.toString(),
          streams: testCase.streams,
        });

        const metricsService = createMetricsService({
          eventsService: mockEventsService,
          ipfsNode: mockIpfsNode,
          environment: "testnet",
          privateKey,
        });

        const metrics = await metricsService.getMetrics();
        expect(metrics.streams).toHaveLength(testCase.expectedCount);

        // Verify granular stream details
        if (testCase.expectedCount > 0) {
          expect(metrics.streams[0]).toHaveProperty("streamId");
          expect(metrics.streams[0]).toHaveProperty("streamCid");
          expect(metrics.streams[0]).toHaveProperty("eventIds");
        }
      }
    });

    it("should accurately reflect changes in pinned CIDs as manifests", async () => {
      // Test with different pin counts
      const testCases = [
        { pins: [], expectedCount: 0 },
        { pins: ["cid1"], expectedCount: 1 },
        { pins: ["cid1", "cid2", "cid3", "cid4", "cid5"], expectedCount: 5 },
      ];

      for (const testCase of testCases) {
        mockIpfsNode.listPins = vi.fn().mockResolvedValue(testCase.pins);

        const metricsService = createMetricsService({
          eventsService: mockEventsService,
          ipfsNode: mockIpfsNode,
          environment: "testnet",
          privateKey,
        });

        const metrics = await metricsService.getMetrics();
        expect(metrics.manifests).toHaveLength(testCase.expectedCount);

        // Verify manifest structure
        if (testCase.expectedCount > 0) {
          expect(typeof metrics.manifests[0]).toBe("string");
        }
      }
    });
  });

  describe("metricsToPayload Integration", () => {
    it("should transform granular metrics correctly for transmission", async () => {
      const metricsService = createMetricsService({
        eventsService: mockEventsService,
        ipfsNode: mockIpfsNode,
        environment: "local",
        privateKey,
      });

      const metrics = await metricsService.getMetrics();
      const payload = metricsToPayload(metrics);

      // Verify payload is ready for granular metrics_server consumption
      expect(payload).toBe(metrics); // Should be identity function now
      expect(payload).toHaveProperty("nodeId");
      expect(payload).toHaveProperty("peerId");
      expect(payload).toHaveProperty("environment");
      expect(payload).toHaveProperty("manifests");
      expect(payload).toHaveProperty("streams");
      expect(payload).toHaveProperty("collectedAt");
      expect(payload).toHaveProperty("signature");
    });
  });
});
