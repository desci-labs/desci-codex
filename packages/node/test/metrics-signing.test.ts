import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMetricsService } from "../src/metrics.js";
import type { CeramicEventsService, CeramicNodeStats } from "../src/events.js";
import type { IPFSNode } from "../src/ipfs.js";
import { peerIdFromPrivateKey, peerIdFromString } from "@libp2p/peer-id";
import { generateKeyPair } from "@libp2p/crypto/keys";
import { Ed25519PrivateKey, PeerId } from "@libp2p/interface";
import { metricsToPayload } from "../src/metrics-pusher.js";

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
    it("can validate legitimate signature", async () => {
      const metricsService = createMetricsService({
        eventsService: mockEventsService,
        ipfsNode: mockIpfsNode,
        environment: "testnet",
        privateKey,
      });

      const metrics = await metricsService.getMetrics();

      const receivedPayload = metricsToPayload(metrics);
      const { signature, ...dataToVerify } = receivedPayload;

      const peerIdFromPayload = peerIdFromString(receivedPayload.ipfsPeerId);
      const publicKeyFromPeerId = peerIdFromPayload.publicKey!;

      const dataBytes = new TextEncoder().encode(JSON.stringify(dataToVerify));
      const signatureBytes = new Uint8Array(signature);

      const isValid = await publicKeyFromPeerId.verify(
        dataBytes,
        signatureBytes,
      );
      expect(isValid).toBe(true);
    });

    it("can reject tampered data", async () => {
      const metricsService = createMetricsService({
        eventsService: mockEventsService,
        ipfsNode: mockIpfsNode,
        environment: "testnet",
        privateKey,
      });

      const metrics = await metricsService.getMetrics();

      const legitimatePayload = metricsToPayload(metrics);

      const tamperedPayload = {
        ...legitimatePayload,
        totalStreams: legitimatePayload.totalStreams + 1, // Tampered value
      };

      const { signature, ...dataToVerify } = tamperedPayload;
      const peerIdFromPayload = peerIdFromString(tamperedPayload.ipfsPeerId);
      const publicKeyFromPeerId = peerIdFromPayload.publicKey!;

      const dataBytes = new TextEncoder().encode(JSON.stringify(dataToVerify));
      const signatureBytes = new Uint8Array(signature);

      // Verify should fail for tampered data
      const isValid = await publicKeyFromPeerId.verify(
        dataBytes,
        signatureBytes,
      );
      expect(isValid).toBe(false);
    });

    it("can reject signature from different key (peer impersonation)", async () => {
      const metricsService = createMetricsService({
        eventsService: mockEventsService,
        ipfsNode: mockIpfsNode,
        environment: "testnet",
        privateKey,
      });

      const metrics = await metricsService.getMetrics();

      const legitimatePayload = metricsToPayload(metrics);

      const attackerPrivateKey = await generateKeyPair("Ed25519");

      const { signature: _, ...dataToSign } = legitimatePayload;
      const dataBytes = new TextEncoder().encode(JSON.stringify(dataToSign));

      const attackerSignature = await attackerPrivateKey.sign(dataBytes);

      const maliciousPayload = {
        ...dataToSign,
        signature: Array.from(attackerSignature),
      };

      const victimPeerId = peerIdFromString(maliciousPayload.ipfsPeerId);
      const victimPublicKey = victimPeerId.publicKey!;
      const attackerSignatureBytes = new Uint8Array(maliciousPayload.signature);

      const isValid = await victimPublicKey.verify(
        dataBytes,
        attackerSignatureBytes,
      );
      expect(isValid).toBe(false);
    });
  });
});
