import logger from "./logger.js";
import type { CeramicEventsService } from "./events.js";
import type { IPFSNode } from "./ipfs.js";
import {
  signMetrics,
  type NodeMetricsSignable,
  type NodeMetricsInternal,
} from "@codex/metrics";
import type { Ed25519PrivateKey } from "@libp2p/interface";

const log = logger.child({ module: "metrics" });

export interface MetricsService {
  getMetrics: () => Promise<NodeMetricsInternal>;
}

export interface MetricsServiceConfig {
  eventsService: CeramicEventsService;
  ipfsNode: IPFSNode;
  environment: "testnet" | "mainnet" | "local";
  privateKey: Ed25519PrivateKey;
}

export function createMetricsService(
  config: MetricsServiceConfig,
): MetricsService {
  return {
    async getMetrics() {
      try {
        log.info("Collecting metrics from services");

        // Get events from the events service
        const ceramicStats = await config.eventsService.stats();

        // Get pinned CIDs from the IPFS service
        const pinnedCids = await config.ipfsNode.listPins();

        const summary = {
          totalStreams: ceramicStats.streams.length,
          totalPinnedCids: pinnedCids.length,
          collectedAt: new Date().toISOString(),
        };

        const ipfsPeerId = (await config.ipfsNode.libp2pInfo()).peerId;

        // Create the signable metrics data
        const signableData: NodeMetricsSignable = {
          ipfsPeerId: ipfsPeerId,
          ceramicPeerId: ceramicStats.peerId,
          environment: config.environment,
          totalStreams: summary.totalStreams,
          totalPinnedCids: summary.totalPinnedCids,
          collectedAt: summary.collectedAt,
        };

        // Sign the metrics using the @codex/metrics library
        const signedMetrics = await signMetrics(
          signableData,
          config.privateKey,
        );

        return signedMetrics;
      } catch (error) {
        log.error(error, "Error collecting metrics");
        throw error;
      }
    },
  };
}
