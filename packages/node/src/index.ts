import express from "express";
import { createIPFSNode } from "./ipfs.js";
import { createCeramicEventsService } from "./events.js";
import logger from "./logger.js";
import { CID } from "multiformats";
import { fileTypeFromBuffer } from "file-type";
import { join } from "path";
import { fileURLToPath } from "url";
import {
  MODEL_IDS,
  registerModelInterests,
} from "@desci-labs/desci-codex-models";
import { initializeQueue, getQueueStats } from "./queue.js";
import { errWithCause } from "pino-std-serializers";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const app = express();
const port = process.env.PORT || 3000;
const log = logger.child({ module: "server" });

// Configure data directory and Ceramic URL
const IPFS_DATA_DIR =
  process.env.IPFS_DATA_DIR ||
  join(__dirname, "../../../local-data/codex-node");
const CERAMIC_ONE_RPC_URL =
  process.env.CERAMIC_ONE_RPC_URL || "http://localhost:5101";
const CERAMIC_ONE_FLIGHT_URL =
  process.env.CERAMIC_ONE_FLIGHT_URL || "http://localhost:5102";

log.info({ dataDir: IPFS_DATA_DIR }, "Using IPFS data directory");

// First, create the IPFS node
const ipfsNode = createIPFSNode({ dataDir: IPFS_DATA_DIR });

// Then initialize the queue with the processor using the now-defined ipfsNode
initializeQueue(async (manifest: string) => {
  // All retry logic is handled in the queue module
  await ipfsNode.pinFile(manifest);
});

// Then create the events service
const ceramicEventsService = createCeramicEventsService({
  rpcUrl: CERAMIC_ONE_RPC_URL,
  flightUrl: CERAMIC_ONE_FLIGHT_URL,
  modelId: MODEL_IDS.researchObject,
});

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Test endpoint to fetch a specific CID
app.get("/test/:cid", async (req, res) => {
  try {
    const { cid } = req.params;
    log.info({ cid }, "Fetching file");
    const file = await ipfsNode.getFile(cid);

    // Try to detect content type from file content
    const fileType = await fileTypeFromBuffer(file);
    let contentType = fileType?.mime || "application/octet-stream";
    log.info({ contentType }, "Content type");

    // If no content type detected, try to determine from CID codec
    if (contentType === "application/octet-stream") {
      const parsedCid = CID.parse(cid);
      const codec = parsedCid.code;

      if (codec === 0x70) {
        // raw
        contentType = "application/octet-stream";
      } else if (codec === 0x55) {
        // cbor
        contentType = "application/cbor";
      } else if (codec === 0x60) {
        // json
        contentType = "application/json";
      } else if (codec === 0x51) {
        // protobuf
        contentType = "application/x-protobuf";
      } else if (codec === 0x63) {
        // dag-cbor
        contentType = "application/vnd.ipld.dag-cbor";
      } else if (codec === 0x71) {
        // dag-json
        contentType = "application/vnd.ipld.dag-json";
      }
    }

    // Set headers for proper browser handling
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", file.length);

    // Convert Uint8Array to Buffer and send using end()
    res.end(Buffer.from(file));
  } catch (error) {
    log.error(error, "Error fetching file");
    res.status(500).json({ error: errWithCause(error as Error) });
  }
});

app.post("/reprovide", async (req, res) => {
  try {
    res.status(200).json({ message: "Starting reprovide..." });
    await ipfsNode.reprovide();
  } catch (error) {
    log.error(error, "Error reproviding");
    res.status(500).json({ error: errWithCause(error as Error) });
  }
});

// Pin a file
app.post("/pin/:cid", async (req, res) => {
  try {
    const { cid } = req.params;
    log.info({ cid }, "Pinning file");
    await ipfsNode.pinFile(cid);
    res.status(200).json({ cid });
  } catch (error) {
    log.error(error, "Error pinning file");
    res.status(500).json({ error: errWithCause(error as Error) });
  }
});

// Unpin a file
app.delete("/pin/:cid", async (req, res) => {
  try {
    const { cid } = req.params;
    log.info({ cid }, "Unpinning file");
    await ipfsNode.unpinFile(cid);
    res.status(200).json({ cid });
  } catch (error) {
    log.error(error, "Error unpinning file");
    res.status(500).json({ error: errWithCause(error as Error) });
  }
});

// List pinned files
app.get("/pins", async (req, res) => {
  try {
    const pins = await ipfsNode.listPins();
    res.status(200).json({ pins });
  } catch (error) {
    log.error(error, "Error listing pins");
    res.status(500).json({ error: errWithCause(error as Error) });
  }
});

// Whoami endpoint
app.get("/libp2pinfo", async (req, res) => {
  try {
    const libp2pinfo = await ipfsNode.libp2pInfo();
    res.json(libp2pinfo);
  } catch (error) {
    log.error(error, "Error getting libp2p info");
    res.status(500).json({ error: errWithCause(error as Error) });
  }
});

// Add a stats endpoint instead of direct queue management
app.get("/queue/stats", (req, res) => {
  res.json(getQueueStats());
});

// Start the server
app.listen(port, async () => {
  try {
    log.info("Starting IPFS node...");
    await ipfsNode.start();

    log.info("Registering model interests...");
    try {
      await registerModelInterests(CERAMIC_ONE_RPC_URL);
    } catch (error) {
      log.warn(
        error,
        "Error registering model interests, this is expected if the RPC port is not accessible (i.e., remote node)",
      );
    }

    log.info("Starting Ceramic events service...");
    await ceramicEventsService.start();

    log.info({ port }, "Server is running");
  } catch (error) {
    log.fatal(error, "Failed to start server");
    process.exit(1);
  }
});

async function gracefulShutdown() {
  log.info("Shutting down gracefully...");
  try {
    await ceramicEventsService.stop();
  } catch (error) {
    log.fatal(error, "Error during event service shutdown");
  }

  try {
    await ipfsNode.stop();
  } catch (error) {
    log.fatal(error, "Error during IPFS node shutdown");
  }
  log.info("Graceful shutdown done");
}

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  log.info("Received SIGTERM signal. Shutting down gracefully...");
  await gracefulShutdown();
  process.exit(1);
});

process.on("SIGINT", async () => {
  log.info("Received SIGINT signal. Shutting down gracefully...");
  await gracefulShutdown();
  process.exit(1);
});

process.on("uncaughtException", async (error) => {
  log.fatal(error, "Uncaught exception");
  await gracefulShutdown();
  process.exit(1);
});
