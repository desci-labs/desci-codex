import { createHelia, type Helia } from "helia";
import { FsDatastore } from "datastore-fs";
import { FsBlockstore } from "blockstore-fs";
import { unixfs, type UnixFS } from "@helia/unixfs";
import { join } from "path";
import { CID } from "multiformats";
import { type Libp2p } from "libp2p";
import logger from "./logger.js";
import { initLibp2p } from "./libp2p.js";
import { trustlessGateway } from "@helia/block-brokers";
import { httpGatewayRouting } from "@helia/routers";
import { errWithCause } from "pino-std-serializers";

const log = logger.child({ module: "ipfs" });

export interface IPFSNode {
  start: () => Promise<Helia>;
  stop: () => Promise<void>;
  getFile: (cid: string) => Promise<Uint8Array>;
  pinFile: (cid: string) => Promise<string>;
  unpinFile: (cid: string) => Promise<string>;
  listPins: () => Promise<string[]>;
  libp2pInfo: () => Promise<{ peerId: string; multiaddrs: string[] }>;
}

export interface IPFSNodeConfig {
  dataDir: string;
}

export function createIPFSNode(config: IPFSNodeConfig): IPFSNode {
  let libp2p: Libp2p;
  let helia: Helia;
  let fs: UnixFS;
  const pins: Set<string> = new Set();

  return {
    async start() {
      try {
        log.info({ dataDir: config.dataDir }, "Starting IPFS node");
        // Create data directories if they don't exist
        const datastore = new FsDatastore(join(config.dataDir, "datastore"), {
          createIfMissing: true,
        });
        const blockstore = new FsBlockstore(join(config.dataDir, "blocks"), {
          createIfMissing: true,
        });

        // Create libp2p node using the refactored function
        libp2p = await initLibp2p();

        // Create Helia instance
        helia = await createHelia({
          datastore,
          blockstore,
          libp2p,
          start: true,
          blockBrokers: [trustlessGateway()],
          routers: [
            httpGatewayRouting({
              gateways: ["https://ipfs.desci.com", "https://pub.desci.com"],
            }),
          ],
        });

        // Create UnixFS instance
        fs = unixfs(helia);

        log.info(
          {
            peerId: libp2p.peerId?.toString(),
            dataDir: config.dataDir,
          },
          "IPFS node started successfully with gateway support",
        );

        return helia;
      } catch (error) {
        log.error(error, "Failed to start IPFS node");
        throw error;
      }
    },

    async stop() {
      try {
        if (helia) {
          await helia.stop();
        }
        log.info("IPFS node stopped successfully");
      } catch (error) {
        log.error(error, "Failed to stop IPFS node");
        throw error;
      }
    },

    async getFile(cid: string) {
      if (!fs) {
        throw new Error("IPFS node not started");
      }
      try {
        const cidObj = CID.parse(cid);
        log.info({ cid }, "Fetching file from IPFS network/gateway");
        const chunks = [];
        for await (const chunk of fs.cat(cidObj)) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      } catch (error) {
        log.error(
          { cid, error: errWithCause(error as Error) },
          "Failed to get file",
        );
        throw error;
      }
    },

    async pinFile(cid: string) {
      try {
        const cidObj = CID.parse(cid);
        if (await helia.pins.isPinned(cidObj)) {
          log.info({ cid }, "File already pinned");
          return cid;
        }

        log.info({ cid }, "Pinning file");
        for await (const pinnedCid of helia.pins.add(CID.parse(cid))) {
          log.info({ pinnedCid: pinnedCid.toString() }, "Pinned block");
        }
        log.info({ cid }, "File pinned successfully");
        return cid;
      } catch (error) {
        log.error(
          { cid, error: errWithCause(error as Error) },
          "Error pinning file",
        );
        throw error;
      }
    },

    async unpinFile(cid: string) {
      if (!helia) {
        throw new Error("IPFS node not started");
      }
      try {
        const cidObj = CID.parse(cid);
        for await (const unpinnedCid of helia.pins.rm(cidObj)) {
          log.info({ cid: unpinnedCid.toString() }, "Unpinned block");
        }
        pins.delete(cid);
        log.info({ cid }, "Unpinned file");
        return cid;
      } catch (error) {
        log.error(
          { cid, error: errWithCause(error as Error) },
          "Failed to unpin file",
        );
        throw error;
      }
    },

    async listPins() {
      if (!helia) {
        throw new Error("IPFS node not started");
      }
      try {
        const pins = [];
        for await (const pin of helia.pins.ls()) {
          pins.push(pin.cid.toString());
        }
        return pins;
      } catch (error) {
        log.error(error, "Failed to list pins");
        throw error;
      }
    },

    async libp2pInfo() {
      if (!helia) {
        throw new Error("IPFS node not started");
      }
      return {
        peerId: libp2p.peerId.toString(),
        multiaddrs: libp2p.getMultiaddrs().map((addr) => addr.toString()),
        peers: libp2p.getPeers(),
        // connections: libp2p.getConnections(),
        protocols: libp2p.getProtocols(),
      };
    },
  };
}
