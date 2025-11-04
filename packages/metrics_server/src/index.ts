import express from "express";
import cors from "cors";
import helmet from "helmet";
import { DatabaseService } from "./database.js";
import { validateMetricsSignature } from "./validation.js";
import {
  NodeMetricsGranularSchema,
  type NodeMetricsGranular,
} from "@codex/metrics";
import logger from "./logger.js";

const app = express();
const port = process.env.PORT || 3001;
const log = logger.child({ module: "server" });

// Initialize Database service
const databaseService = new DatabaseService();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health check endpoint
app.get("/health", async (req, res) => {
  if (await databaseService.dbConnectionIsOk()) {
    res
      .status(200)
      .json({ status: "healthy", timestamp: new Date().toISOString() });
  } else {
    res
      .status(503)
      .json({ status: "unhealthy", error: "Database connection failed" });
  }
});

// API v1 routes
const apiV1 = express.Router();

// POST /api/v1/metrics/node - Node health metrics
apiV1.post("/metrics/node", async (req, res) => {
  try {
    // Parse and validate structure using Zod schema
    let metrics: NodeMetricsGranular;
    try {
      metrics = NodeMetricsGranularSchema.parse(req.body);
    } catch (error) {
      return res.status(400).json({
        error: "Invalid metrics structure",
        details:
          error instanceof Error ? error.message : "Unknown validation error",
      });
    }

    // Validate cryptographic signature
    const validationResult = await validateMetricsSignature(metrics);
    if (!validationResult.isValid) {
      log.warn(
        {
          nodeId: metrics.nodeId,
          peerId: metrics.peerId,
          error: validationResult.error,
        },
        "Rejected metrics submission due to invalid signature",
      );
      return res.status(401).json({
        error: "Invalid signature",
        details: validationResult.error,
      });
    }

    // Store granular metrics directly in database using drizzle
    await databaseService.writeNodeMetrics(metrics);

    log.info(
      {
        nodeId: metrics.nodeId,
        peerId: metrics.peerId,
        environment: metrics.environment,
        manifestCount: metrics.manifests.length,
        streamCount: metrics.streams.length,
      },
      "Successfully processed and validated granular node metrics",
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    log.error(error, "Error processing node metrics");
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.use("/api/v1", apiV1);

// Root route handler
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Codex Metrics Server",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      metrics: "/api/v1/metrics/node",
    },
  });
});

// Error handling middleware
app.use(
  (
    error: Error,
    req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: express.NextFunction,
  ) => {
    log.error(error, "Unhandled error");
    res.status(500).json({ error: "Internal server error" });
  },
);

// Graceful shutdown
process.on("SIGINT", async () => {
  log.info("Received SIGINT, shutting down gracefully...");
  try {
    await databaseService.close();
    log.info("Database connection closed");
    process.exit(0);
  } catch (error) {
    log.error(error, "Error during shutdown");
    process.exit(1);
  }
});

process.on("SIGTERM", async () => {
  log.info("Received SIGTERM, shutting down gracefully...");
  try {
    await databaseService.close();
    log.info("Database connection closed");
    process.exit(0);
  } catch (error) {
    log.error(error, "Error during shutdown");
    process.exit(1);
  }
});

// Start server
const startServer = async () => {
  try {
    app.listen(port, () => {
      log.info({ port }, "Metrics server started");
    });
  } catch (error) {
    log.error(error, "Failed to start server");
    process.exit(1);
  }
};

startServer();
