import express from "express";
import { createIPFSNode } from "./ipfs.js";
import { createCeramicEventsService } from "./events.js";
import { createMetricsService } from "./metrics.js";
import { createMetricsPusher } from "./metrics-pusher.js";
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

// Metrics backend configuration
const METRICS_BACKEND_URL =
  process.env.METRICS_BACKEND_URL ?? "http://localhost:3001";
const METRICS_PUSH_INTERVAL_MS = process.env.METRICS_PUSH_INTERVAL_MS
  ? parseInt(process.env.METRICS_PUSH_INTERVAL_MS)
  : 1 * 60 * 1000; // 1 minute

// Environment configuration
const CODEX_ENVIRONMENT = process.env.CODEX_ENVIRONMENT as
  | "testnet"
  | "mainnet"
  | "local"
  | undefined;
if (
  !CODEX_ENVIRONMENT ||
  !["testnet", "mainnet", "local"].includes(CODEX_ENVIRONMENT)
) {
  log.fatal(
    "CODEX_ENVIRONMENT must be set to either 'testnet', 'mainnet', or 'local'",
  );
  process.exit(1);
}

log.info(
  { dataDir: IPFS_DATA_DIR, environment: CODEX_ENVIRONMENT },
  "Using IPFS data directory",
);

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

// Create metrics pusher if backend URL is configured and not in local environment
let metricsPusher: ReturnType<typeof createMetricsPusher> | null = null;
let metricsService: ReturnType<typeof createMetricsService> | null = null;
if (METRICS_BACKEND_URL && CODEX_ENVIRONMENT !== "local") {
  log.info({ backendUrl: METRICS_BACKEND_URL }, "Metrics service configured");
} else if (CODEX_ENVIRONMENT === "local") {
  log.info("Local environment detected, metrics service disabled");
} else {
  log.info("No metrics backend URL configured, metrics service disabled");
}

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

app.get("/queue", (req, res) => {
  res.json(getQueueStats());
});

// Metrics endpoint
app.get("/metrics", async (req, res) => {
  try {
    if (!metricsService) {
      res.status(503).json({ error: "Metrics service not initialized" });
      return;
    }
    const metrics = await metricsService.getMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    log.error(error, "Error getting metrics");
    res.status(500).json({ error: errWithCause(error as Error) });
  }
});

// Start the server
app.listen(port, async () => {
  try {
    log.info("Starting IPFS node...");
    await ipfsNode.start();

    // Get the private key after IPFS node is started
    const privateKey = await ipfsNode.getPrivateKey();

    // Ensure we have an Ed25519 key for metrics signing
    if (privateKey.type !== "Ed25519") {
      throw new Error(
        `Metrics requires Ed25519 keys, but got ${privateKey.type}`,
      );
    }

    log.info("Registering model interests...");
    try {
      await registerModelInterests(CERAMIC_ONE_RPC_URL);
    } catch (error) {
      log.warn(
        error,
        "Error registering model interests, this is expected if the RPC port is not accessible (i.e., remote node)",
      );
    }

    // This is blocking, so it has to be started before metrics pusher
    log.info("Starting Ceramic events service...");
    await ceramicEventsService.start();

    // Create the metrics service with private key
    metricsService = createMetricsService({
      eventsService: ceramicEventsService,
      ipfsNode: ipfsNode,
      environment: CODEX_ENVIRONMENT,
      privateKey: privateKey as import("@libp2p/interface").Ed25519PrivateKey,
    });

    // Create metrics pusher if backend URL is configured and not in local environment
    if (METRICS_BACKEND_URL && CODEX_ENVIRONMENT !== "local") {
      metricsPusher = createMetricsPusher({
        metricsService,
        backendUrl: METRICS_BACKEND_URL,
        pushIntervalMs: METRICS_PUSH_INTERVAL_MS,
      });
    }

    // Now start metrics pusher after events service is ready
    if (metricsPusher) {
      log.info("Starting metrics pusher...");
      await metricsPusher.start();
    }
  } catch (error) {
    log.fatal(error, "Failed to start server");
    process.exit(1);
  }
});

async function gracefulShutdown() {
  log.info("Shutting down gracefully...");

  // Stop metrics pusher first
  if (metricsPusher) {
    try {
      log.info("Stopping metrics pusher...");
      await metricsPusher.stop();
    } catch (error) {
      log.error(error, "Error during metrics pusher shutdown");
    }
  }

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
