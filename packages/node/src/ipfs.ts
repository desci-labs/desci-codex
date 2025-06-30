import { createHelia, type Helia } from "helia";
import { FsDatastore } from "datastore-fs";
import { FsBlockstore } from "blockstore-fs";
import { unixfs, type UnixFS } from "@helia/unixfs";
import { join } from "path";
import { CID } from "multiformats";
import logger from "./logger.js";
import { bitswap, trustlessGateway } from "@helia/block-brokers";
import { httpGatewayRouting, libp2pRouting } from "@helia/routers";
import { errWithCause } from "pino-std-serializers";
import { initLibp2p } from "./libp2p.js";
import type { Libp2p } from "libp2p";

const log = logger.child({ module: "ipfs" });

export interface IPFSNode {
  start: () => Promise<Helia>;
  stop: () => Promise<void>;
  getFile: (cid: string) => Promise<Uint8Array>;
  pinFile: (cid: string) => Promise<string>;
  unpinFile: (cid: string) => Promise<string>;
  listPins: () => Promise<string[]>;
  reprovide: () => Promise<void>;
  libp2pInfo: () => Promise<{ peerId: string; multiaddrs: string[] }>;
}

export interface IPFSNodeConfig {
  dataDir: string;
}

export function createIPFSNode(config: IPFSNodeConfig): IPFSNode {
  let libp2p: Libp2p;
  let helia: Helia;
  let fs: UnixFS;

  return {
    async start() {
      try {
        log.info({ dataDir: config.dataDir }, "Starting IPFS node");
        const datastore = new FsDatastore(join(config.dataDir, "datastore"), {
          createIfMissing: true,
        });
        const blockstore = new FsBlockstore(join(config.dataDir, "blocks"), {
          createIfMissing: true,
        });

        libp2p = await initLibp2p(datastore);

        // Create Helia instance
        helia = await createHelia({
          datastore,
          blockstore,
          libp2p,
          blockBrokers: [trustlessGateway(), bitswap()],
          routers: [
            httpGatewayRouting({
              gateways: ["https://ipfs.desci.com", "https://pub.desci.com"],
            }),
            libp2pRouting(libp2p),
          ],
          start: true,
        });

        // Create UnixFS instance
        fs = unixfs(helia);

        log.info(
          {
            peerId: libp2p.peerId?.toString(),
            dataDir: config.dataDir,
          },
          "IPFS node started successfully",
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
      if (!helia) {
        throw new Error("IPFS node not started");
      }

      try {
        const cidObj = CID.parse(cid);
        if (await helia.pins.isPinned(cidObj)) {
          log.info({ cid }, "File already pinned");
          return cid;
        }

        const startTime = Date.now();
        for await (const pinnedCid of helia.pins.add(cidObj)) {
          log.debug(
            { cid, block: pinnedCid.toString(), time: Date.now() },
            "Pinned block",
          );
        }
        const duration = Date.now() - startTime;
        log.info({ cid, duration }, "File pinned successfully");
        // await helia.routing.provide(cidObj);
        // log.info({ cid }, "CID added to provider list");
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

    async reprovide() {
      if (!helia) {
        throw new Error("IPFS node not started");
      }
      try {
        log.info("Starting reprovide of all pinned files");
        for await (const pin of helia.pins.ls()) {
          await helia.routing.provide(pin.cid);
          log.info({ cid: pin.cid.toString() }, "Provided cid");
        }
      } catch (error) {
        log.error(error, "Failed to reprovide");
        throw error;
      }
    },

    async libp2pInfo() {
      if (!helia) {
        throw new Error("IPFS node not started");
      }

      return {
        peerId: libp2p.peerId?.toString(),
        multiaddrs: libp2p.getMultiaddrs().map((addr) => addr.toString()),
        peers: libp2p.getPeers(),
        // connections: libp2p.getConnections(),
        protocols: libp2p.getProtocols(),
      };
    },
  };
}
