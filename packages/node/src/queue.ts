import PQueue from "p-queue";
import logger from "./logger.js";
import { errWithCause } from "pino-std-serializers";

const log = logger.child({ module: "queue" });

// Create manifest processing queue with concurrency limit
const manifestQueue = new PQueue({ concurrency: 10 });

// Statistics for monitoring
let totalQueued = 0;
let totalProcessed = 0;
let totalFailed = 0;

// Set up the processor function
let processFunction: ((manifest: string) => Promise<void>) | undefined =
  undefined;

// Add retry tracking
const retryTracker = new Map<string, number>();
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 10000; // 10 seconds between retries

export const initializeQueue = (
  processor: (manifest: string) => Promise<void>,
) => {
  processFunction = processor;
  log.info("Queue initialized with processor function");
};

export const queueManifest = (manifest: string, retryCount = 0) => {
  if (!processFunction) {
    log.error("Cannot queue manifest: processor function not initialized");
    return false;
  }

  totalQueued++;
  log.info(
    {
      manifest,
      done: totalProcessed,
      queueSize: manifestQueue.size,
      queuePending: manifestQueue.pending,
      retryCount,
    },
    "Queueing manifest",
  );

  manifestQueue.add(async () => {
    try {
      await processFunction!(manifest);
      totalProcessed++;

      // Clear retry count on success
      retryTracker.delete(manifest);
    } catch (error) {
      totalFailed++;

      // Get current retry count
      const currentRetries = retryTracker.get(manifest) || 0;

      if (currentRetries < MAX_RETRIES) {
        // Increment retry count
        retryTracker.set(manifest, currentRetries + 1);

        log.warn(
          {
            manifest,
            retryCount: currentRetries + 1,
            maxRetries: MAX_RETRIES,
            error: errWithCause(error as Error),
          },
          "Pinning failed, scheduling retry",
        );

        // Schedule retry with delay
        setTimeout(() => {
          queueManifest(manifest, currentRetries + 1);
        }, RETRY_DELAY_MS);
      } else {
        log.error(
          {
            manifest,
            retries: currentRetries,
            error: errWithCause(error as Error),
          },
          "Failed to process manifest after maximum retries",
        );

        // Clear retry count after max retries to allow future attempts
        retryTracker.delete(manifest);
      }
    }
  });

  return true;
};

// Utility function to get queue statistics
export const getQueueStats = () => {
  return {
    size: manifestQueue.size,
    pending: manifestQueue.pending,
    totalQueued,
    totalProcessed,
    totalFailed,
  };
};
