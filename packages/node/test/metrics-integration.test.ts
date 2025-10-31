import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMetricsService } from "../src/metrics.js";
import { metricsToPayload } from "../src/metrics-pusher.js";
import {
  validateMetricsSignature,
  NodeMetricsInternalSchema,
} from "@codex/metrics";
import type { CeramicEventsService, CeramicNodeStats } from "../src/events.js";
import type { IPFSNode } from "../src/ipfs.js";
import { peerIdFromPrivateKey } from "@libp2p/peer-id";
import { generateKeyPair } from "@libp2p/crypto/keys";
import { Ed25519PrivateKey, PeerId } from "@libp2p/interface";

/**
 * Integration tests to ensure compatibility with \@codex/metrics library.
 * These tests verify that:
 * 1. Node package produces metrics compatible with \@codex/metrics validation
 * 2. Any changes to \@codex/metrics API will cause test failures here
 * 3. The complete flow from node -\> metrics_server validation works
 */
describe("Metrics Library Integration", () => {
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

  describe("Schema Compatibility", () => {
    it("should produce metrics that pass @codex/metrics schema validation", async () => {
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

      // Verify the parsed structure matches expectations
      const parsed = NodeMetricsInternalSchema.parse(payload);
      expect(parsed.identity.ipfs).toBe(peerId.toString());
      expect(parsed.environment).toBe("testnet");
      expect(parsed.summary.totalStreams).toBe(2);
      expect(parsed.summary.totalPinnedCids).toBe(3);
      expect(parsed.signature).toBeInstanceOf(Array);
    });

    it("should produce metrics that pass @codex/metrics signature validation", async () => {
      const metricsService = createMetricsService({
        eventsService: mockEventsService,
        ipfsNode: mockIpfsNode,
        environment: "mainnet",
        privateKey,
      });

      const metrics = await metricsService.getMetrics();
      const payload = metricsToPayload(metrics);

      // Use the @codex/metrics validation function
      const validationResult = await validateMetricsSignature(payload);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.error).toBeUndefined();
    });
  });

  describe("API Contract Compliance", () => {
    it("should maintain expected metrics structure that metrics_server can process", async () => {
      const metricsService = createMetricsService({
        eventsService: mockEventsService,
        ipfsNode: mockIpfsNode,
        environment: "local",
        privateKey,
      });

      const metrics = await metricsService.getMetrics();
      const payload = metricsToPayload(metrics);

      // Verify the payload structure matches what metrics_server expects
      expect(payload).toHaveProperty("identity");
      expect(payload).toHaveProperty("environment");
      expect(payload).toHaveProperty("summary");
      expect(payload).toHaveProperty("signature");

      expect(payload.identity).toHaveProperty("ipfs");
      expect(payload.identity).toHaveProperty("ceramic");
      expect(payload.summary).toHaveProperty("totalStreams");
      expect(payload.summary).toHaveProperty("totalPinnedCids");
      expect(payload.summary).toHaveProperty("collectedAt");

      // Verify types
      expect(typeof payload.identity.ipfs).toBe("string");
      expect(typeof payload.identity.ceramic).toBe("string");
      expect(typeof payload.environment).toBe("string");
      expect(typeof payload.summary.totalStreams).toBe("number");
      expect(typeof payload.summary.totalPinnedCids).toBe("number");
      expect(typeof payload.summary.collectedAt).toBe("string");
      expect(Array.isArray(payload.signature)).toBe(true);
    });

    it("should work with all supported environments", async () => {
      const environments = ["testnet", "mainnet", "local"] as const;

      for (const environment of environments) {
        const metricsService = createMetricsService({
          eventsService: mockEventsService,
          ipfsNode: mockIpfsNode,
          environment,
          privateKey,
        });

        const metrics = await metricsService.getMetrics();
        const payload = metricsToPayload(metrics);

        // Schema validation
        expect(() => NodeMetricsInternalSchema.parse(payload)).not.toThrow();

        // Signature validation
        const validationResult = await validateMetricsSignature(payload);
        expect(validationResult.isValid).toBe(true);
        expect(payload.environment).toBe(environment);
      }
    });
  });

  describe("Breaking Change Detection", () => {
    it("should detect if @codex/metrics changes its validation behavior", async () => {
      const metricsService = createMetricsService({
        eventsService: mockEventsService,
        ipfsNode: mockIpfsNode,
        environment: "testnet",
        privateKey,
      });

      const metrics = await metricsService.getMetrics();
      const payload = metricsToPayload(metrics);

      // Tamper with the data to ensure validation still catches it
      const tamperedPayload = {
        ...payload,
        summary: {
          ...payload.summary,
          totalStreams: payload.summary.totalStreams + 999,
        },
      };

      const validationResult = await validateMetricsSignature(tamperedPayload);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.error).toBe(
        "Cryptographic signature verification failed",
      );

      // If this test starts failing, it means \@codex/metrics validation behavior changed
    });
  });
});
