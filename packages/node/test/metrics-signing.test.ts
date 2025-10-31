import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMetricsService } from "../src/metrics.js";
import type { CeramicEventsService, CeramicNodeStats } from "../src/events.js";
import type { IPFSNode } from "../src/ipfs.js";
import { peerIdFromPrivateKey } from "@libp2p/peer-id";
import { generateKeyPair } from "@libp2p/crypto/keys";
import { Ed25519PrivateKey, PeerId } from "@libp2p/interface";
import { metricsToPayload } from "../src/metrics-pusher.js";
import { validateMetricsSignature, signMetrics } from "@codex/metrics";

describe("Metrics Signing", () => {
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

  describe("createMetricsService", () => {
    it("should create a metrics service with signing capability", () => {
      const metricsService = createMetricsService({
        eventsService: mockEventsService,
        ipfsNode: mockIpfsNode,
        environment: "testnet",
        privateKey,
      });

      expect(metricsService).toBeDefined();
      expect(typeof metricsService.getMetrics).toBe("function");
    });

    it("should collect metrics and sign them correctly", async () => {
      const metricsService = createMetricsService({
        eventsService: mockEventsService,
        ipfsNode: mockIpfsNode,
        environment: "testnet",
        privateKey,
      });

      const metrics = await metricsService.getMetrics();

      // Verify the metrics structure
      expect(metrics).toHaveProperty("identity");
      expect(metrics).toHaveProperty("environment");
      expect(metrics).toHaveProperty("summary");
      expect(metrics).toHaveProperty("signature");

      expect(metrics.identity.ipfs).toBe(peerId.toString());
      expect(metrics.identity.ceramic).toBe(peerId.toString());
      expect(metrics.environment).toBe("testnet");
      expect(metrics.summary.totalStreams).toBe(2);
      expect(metrics.summary.totalPinnedCids).toBe(3);
      expect(metrics.summary.collectedAt).toBeDefined();
      expect(metrics.signature).toBeInstanceOf(Array);
      expect(metrics.signature.length).toBeGreaterThan(0);
    });
  });

  describe("Simulated backend verification", () => {
    it("can validate legitimate signature using @codex/metrics library", async () => {
      const metricsService = createMetricsService({
        eventsService: mockEventsService,
        ipfsNode: mockIpfsNode,
        environment: "testnet",
        privateKey,
      });

      const metrics = await metricsService.getMetrics();
      const payload = metricsToPayload(metrics);

      // Use the @codex/metrics validation function
      const validationResult = await validateMetricsSignature(payload);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.error).toBeUndefined();
    });

    it("can reject tampered data using @codex/metrics library", async () => {
      const metricsService = createMetricsService({
        eventsService: mockEventsService,
        ipfsNode: mockIpfsNode,
        environment: "testnet",
        privateKey,
      });

      const metrics = await metricsService.getMetrics();
      const legitimatePayload = metricsToPayload(metrics);

      // Tamper with the data
      const tamperedPayload = {
        ...legitimatePayload,
        summary: {
          ...legitimatePayload.summary,
          totalStreams: legitimatePayload.summary.totalStreams + 999,
        },
      };

      // Use the @codex/metrics validation function
      const validationResult = await validateMetricsSignature(tamperedPayload);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.error).toBe(
        "Cryptographic signature verification failed",
      );
    });

    it("can reject signature from different key (peer impersonation)", async () => {
      const victimKey = await generateKeyPair("Ed25519");
      const victimPeerId = peerIdFromPrivateKey(victimKey);
      const attackerKey = await generateKeyPair("Ed25519");

      // Create metrics claiming to be from victim
      const fakeSignableData = {
        ipfsPeerId: victimPeerId.toString(),
        ceramicPeerId: victimPeerId.toString(),
        environment: "testnet" as const,
        totalStreams: 100,
        totalPinnedCids: 50,
        collectedAt: new Date().toISOString(),
      };

      // Sign with attacker's key (impersonation attempt)
      const maliciousMetrics = await signMetrics(fakeSignableData, attackerKey);

      // Use the @codex/metrics validation function
      const validationResult = await validateMetricsSignature(maliciousMetrics);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.error).toBe(
        "Cryptographic signature verification failed",
      );
    });
  });
});
