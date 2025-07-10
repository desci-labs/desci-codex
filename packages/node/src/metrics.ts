import logger from "./logger.js";
import type { CeramicEventsService } from "./events.js";
import type { IPFSNode } from "./ipfs.js";

const log = logger.child({ module: "metrics" });

export interface MetricsService {
  getMetrics: () => Promise<{
    identity: {
      ipfs: string;
      ceramic: string;
    };
    streams: {
      id: string;
      versions: string[];
    }[];
    pinnedCids: string[];
    summary: {
      totalStreams: number;
      totalPinnedCids: number;
      collectedAt: string;
    };
  }>;
}

export interface MetricsServiceConfig {
  eventsService: CeramicEventsService;
  ipfsNode: IPFSNode;
}

export function createMetricsService(
  config: MetricsServiceConfig,
): MetricsService {
  // TODO: sign with private key for peerId
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
        return {
          identity: {
            ipfs: ipfsPeerId,
            ceramic: ceramicStats.peerId,
          },
          streams: ceramicStats.streams,
          pinnedCids,
          summary,
        };
      } catch (error) {
        log.error(error, "Error collecting metrics");
        throw error;
      }
    },
  };
}
