import logger from "./logger.js";
import type { MetricsService } from "./metrics.js";

const log = logger.child({ module: "metrics-pusher" });

export interface MetricsPusherConfig {
  metricsService: MetricsService;
  backendUrl: string;
  pushIntervalMs?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export interface MetricsPusher {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  pushMetrics: () => Promise<void>;
}

export const metricsToPayload = (
  metrics: Awaited<ReturnType<MetricsService["getMetrics"]>>,
) => {
  // The metrics are already in the correct format from @codex/metrics
  return metrics;
};

export function createMetricsPusher(
  config: MetricsPusherConfig,
): MetricsPusher {
  const {
    metricsService,
    backendUrl,
    pushIntervalMs = 5 * 60 * 1000, // 5 minutes
    retryAttempts = 3,
    retryDelayMs = 1000,
  } = config;

  let intervalId: NodeJS.Timeout | null = null;
  let isRunning = false;

  async function pushMetricsWithRetry(attempt = 1): Promise<void> {
    try {
      const metrics = await metricsService.getMetrics();

      const payload = metricsToPayload(metrics);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const response = await fetch(`${backendUrl}/api/v1/metrics/node`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      log.info(
        {
          nodeId: metrics.nodeId,
          peerId: metrics.peerId,
          environment: metrics.environment,
        },
        "Successfully pushed granular metrics to backend",
      );
    } catch (error) {
      log.error(error, "Error pushing metrics to backend");

      if (attempt < retryAttempts) {
        log.info({ attempt, retryDelayMs }, "Retrying metrics push");
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        return pushMetricsWithRetry(attempt + 1);
      } else {
        log.error("Failed to push metrics after all retry attempts");
      }
    }
  }

  async function pushMetrics(): Promise<void> {
    if (!isRunning) {
      log.warn("Metrics pusher is not running");
      return;
    }

    await pushMetricsWithRetry();
  }

  async function start(): Promise<void> {
    if (isRunning) {
      log.warn("Metrics pusher is already running");
      return;
    }

    log.info(
      {
        backendUrl,
        pushIntervalMs,
      },
      "Starting metrics pusher",
    );

    isRunning = true;

    // Push initial metrics
    await pushMetrics();

    // Set up interval for periodic pushes
    intervalId = setInterval(pushMetrics, pushIntervalMs);

    log.info("Metrics pusher started successfully");
  }

  async function stop(): Promise<void> {
    if (!isRunning) {
      log.warn("Metrics pusher is not running");
      return;
    }

    log.info("Stopping metrics pusher");

    isRunning = false;

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }

    log.info("Metrics pusher stopped");
  }

  return {
    start,
    stop,
    pushMetrics,
  };
}
