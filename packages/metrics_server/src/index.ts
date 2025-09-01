import express from "express";
import cors from "cors";
import helmet from "helmet";
import { DatabaseService } from "./database.js";
import {
  validateMetricsSignature,
  type SignedNodeMetrics,
} from "./validation.js";
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
    const signedMetrics: SignedNodeMetrics = req.body;

    // Validate required fields
    if (
      !signedMetrics.ipfsPeerId ||
      !signedMetrics.ceramicPeerId ||
      !signedMetrics.environment
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: ipfsPeerId, ceramicPeerId, environment",
      });
    }

    // Validate signature is present
    if (!signedMetrics.signature || !Array.isArray(signedMetrics.signature)) {
      return res.status(400).json({
        error: "Missing or invalid signature",
      });
    }

    // Validate environment value
    if (!["testnet", "mainnet", "local"].includes(signedMetrics.environment)) {
      return res.status(400).json({
        error:
          "Invalid environment value. Must be 'testnet', 'mainnet', or 'local'",
      });
    }

    // Set collectedAt if not provided
    if (!signedMetrics.collectedAt) {
      signedMetrics.collectedAt = new Date().toISOString();
    }

    // Validate cryptographic signature
    const validationResult = await validateMetricsSignature(signedMetrics);
    if (!validationResult.isValid) {
      log.warn(
        {
          ipfsPeerId: signedMetrics.ipfsPeerId,
          error: validationResult.error,
        },
        "Rejected metrics submission due to invalid signature",
      );
      return res.status(401).json({
        error: "Invalid signature",
        details: validationResult.error,
      });
    }

    // Extract metrics without signature for database storage
    const { signature: _, ...metrics } = signedMetrics;
    await databaseService.writeNodeMetrics(metrics);

    log.info(
      { ipfsPeerId: metrics.ipfsPeerId, environment: metrics.environment },
      "Successfully processed and validated node metrics",
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
    // Initialize database
    await databaseService.initialize();

    app.listen(port, () => {
      log.info({ port }, "Metrics server started");
    });
  } catch (error) {
    log.error(error, "Failed to start server");
    process.exit(1);
  }
};

startServer();
