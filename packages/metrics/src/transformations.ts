import type { NodeMetricsGranular, NodeMetricsSignable } from "./types.js";

/**
 * Extracts signable data from granular format by removing the signature field.
 *
 * @param granular - The granular metrics format
 * @returns The signable data without signature
 */
export function extractSignableData(
  granular: NodeMetricsGranular,
): NodeMetricsSignable {
  return {
    nodeId: granular.nodeId,
    ceramicPeerId: granular.ceramicPeerId,
    environment: granular.environment,
    manifests: granular.manifests,
    streams: granular.streams,
    collectedAt: granular.collectedAt,
  };
}

/**
 * Creates granular format from signable data and signature.
 *
 * @param signable - The data that was signed
 * @param signature - The signature array
 * @returns Complete granular format with signature
 */
export function createInternalFormat(
  signable: NodeMetricsSignable,
  signature: number[],
): NodeMetricsGranular {
  return {
    nodeId: signable.nodeId,
    ceramicPeerId: signable.ceramicPeerId,
    environment: signable.environment,
    manifests: signable.manifests,
    streams: signable.streams,
    collectedAt: signable.collectedAt,
    signature,
  };
}

/**
 * Validates that a granular format object has all required fields.
 *
 * @param data - The object to validate
 * @returns True if the object is a valid granular format
 */
export function isValidInternalFormat(
  data: unknown,
): data is NodeMetricsGranular {
  if (!data || typeof data !== "object") {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.nodeId === "string" &&
    typeof obj.ceramicPeerId === "string" &&
    ["testnet", "mainnet", "local"].includes(obj.environment as string) &&
    Array.isArray(obj.manifests) &&
    obj.manifests.every((m: unknown) => typeof m === "string") &&
    Array.isArray(obj.streams) &&
    obj.streams.every(
      (s: unknown) =>
        s !== null &&
        typeof s === "object" &&
        typeof (s as Record<string, unknown>).streamId === "string" &&
        typeof (s as Record<string, unknown>).streamCid === "string" &&
        Array.isArray((s as Record<string, unknown>).eventIds) &&
        ((s as Record<string, unknown>).eventIds as unknown[]).every(
          (e: unknown) => typeof e === "string",
        ),
    ) &&
    typeof obj.collectedAt === "string" &&
    Array.isArray(obj.signature) &&
    obj.signature.every((v: unknown) => typeof v === "number")
  );
}

/**
 * Creates a deep clone of metrics data to prevent mutations.
 *
 * @param data - The metrics data to clone
 * @returns A deep copy of the data
 */
export function cloneMetrics<
  T extends NodeMetricsGranular | NodeMetricsSignable,
>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}
