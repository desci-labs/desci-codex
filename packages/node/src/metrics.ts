import logger from "./logger.js";
import type { CeramicEventsService } from "./events.js";
import type { IPFSNode } from "./ipfs.js";
import {
  signMetrics,
  type NodeMetricsSignable,
  type NodeMetricsGranular,
  type Stream,
} from "@desci-labs/desci-codex-metrics";
import type { Ed25519PrivateKey } from "@libp2p/interface";

const log = logger.child({ module: "metrics" });

export interface MetricsService {
  getMetrics: () => Promise<NodeMetricsGranular>;
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
        log.info("Collecting granular metrics from services");

        // Get events from the events service
        const ceramicStats = await config.eventsService.stats();

        // Get pinned CIDs from the IPFS service
        const pinnedCids = await config.ipfsNode.listPins();

        const ipfsPeerId = (await config.ipfsNode.libp2pInfo()).peerId;
        const nodeId = ipfsPeerId;
        const ceramicPeerId = ceramicStats.peerId;

        // Transform pinned CIDs into manifests (now just strings)
        const manifests: string[] = pinnedCids.map((cid) => cid.toString());

        // Transform ceramic streams into granular streams with events
        const streams: Stream[] = ceramicStats.streams.map((streamData) => ({
          streamId: streamData.id,
          streamCid: streamData.id, // In the future, this might be different
          eventIds: streamData.versions, // Using versions as event IDs
        }));

        // Create the signable granular metrics data
        const signableData: NodeMetricsSignable = {
          nodeId: nodeId,
          ceramicPeerId: ceramicPeerId,
          environment: config.environment,
          manifests: manifests,
          streams: streams,
          collectedAt: new Date().toISOString(),
        };

        // Sign the metrics using the @desci-labs/desci-codex-metrics library
        const signedMetrics = await signMetrics(
          signableData,
          config.privateKey,
        );

        log.info(
          {
            nodeId,
            ceramicPeerId: ceramicPeerId,
            manifestCount: manifests.length,
            streamCount: streams.length,
            totalEvents: streams.reduce((sum, s) => sum + s.eventIds.length, 0),
          },
          "Collected granular metrics",
        );

        return signedMetrics;
      } catch (error) {
        log.error(error, "Error collecting granular metrics");
        throw error;
      }
    },
  };
}
