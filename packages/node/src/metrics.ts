import logger from "./logger.js";
import type { CeramicEventsService } from "./events.js";
import type { IPFSNode } from "./ipfs.js";
import { loadOrCreateSelfKey } from "@libp2p/config";

const log = logger.child({ module: "metrics" });

export interface MetricsService {
  getMetrics: () => Promise<{
    identity: {
      ipfs: string;
      ceramic: string;
    };
    environment: "testnet" | "mainnet" | "local";
    summary: {
      totalStreams: number;
      totalPinnedCids: number;
      collectedAt: string;
    };
    signature: number[];
  }>;
}

export interface MetricsServiceConfig {
  eventsService: CeramicEventsService;
  ipfsNode: IPFSNode;
  environment: "testnet" | "mainnet" | "local";
  privateKey: Awaited<ReturnType<typeof loadOrCreateSelfKey>>;
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

        // Create the metrics data that will be sent to backend
        const metricsForBackend = {
          ipfsPeerId: ipfsPeerId,
          ceramicPeerId: ceramicStats.peerId,
          environment: config.environment,
          totalStreams: summary.totalStreams,
          totalPinnedCids: summary.totalPinnedCids,
          collectedAt: summary.collectedAt,
        };

        // Sign the exact data that will be sent to backend
        const metricsBytes = new TextEncoder().encode(
          JSON.stringify(metricsForBackend),
        );
        const signature = await config.privateKey.sign(metricsBytes);

        return {
          identity: {
            ipfs: ipfsPeerId,
            ceramic: ceramicStats.peerId,
          },
          environment: config.environment,
          summary,
          signature: Array.from(signature), // Convert to array for JSON serialization
        };
      } catch (error) {
        log.error(error, "Error collecting metrics");
        throw error;
      }
    },
  };
}
