import type { NodeMetricsInternal, NodeMetricsSignable } from "./types.js";

/**
 * Extracts signable data from internal format by removing the signature field
 * and flattening the structure.
 *
 * @param internal - The internal metrics format
 * @returns The signable data without signature
 */
export function extractSignableData(
  internal: NodeMetricsInternal,
): NodeMetricsSignable {
  return {
    ipfsPeerId: internal.identity.ipfs,
    ceramicPeerId: internal.identity.ceramic,
    environment: internal.environment,
    totalStreams: internal.summary.totalStreams,
    totalPinnedCids: internal.summary.totalPinnedCids,
    collectedAt: internal.summary.collectedAt,
  };
}

/**
 * Creates internal format from signable data and signature.
 *
 * @param signable - The data that was signed
 * @param signature - The signature array
 * @returns Complete internal format with signature
 */
export function createInternalFormat(
  signable: NodeMetricsSignable,
  signature: number[],
): NodeMetricsInternal {
  return {
    identity: {
      ipfs: signable.ipfsPeerId,
      ceramic: signable.ceramicPeerId,
    },
    environment: signable.environment,
    summary: {
      totalStreams: signable.totalStreams,
      totalPinnedCids: signable.totalPinnedCids,
      collectedAt: signable.collectedAt,
    },
    signature,
  };
}

/**
 * Validates that an internal format object has all required fields.
 *
 * @param data - The object to validate
 * @returns True if the object is a valid internal format
 */
export function isValidInternalFormat(
  data: unknown,
): data is NodeMetricsInternal {
  if (!data || typeof data !== "object") {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return (
    obj.identity !== null &&
    typeof obj.identity === "object" &&
    typeof (obj.identity as Record<string, unknown>).ipfs === "string" &&
    typeof (obj.identity as Record<string, unknown>).ceramic === "string" &&
    ["testnet", "mainnet", "local"].includes(obj.environment as string) &&
    obj.summary !== null &&
    typeof obj.summary === "object" &&
    typeof (obj.summary as Record<string, unknown>).totalStreams === "number" &&
    typeof (obj.summary as Record<string, unknown>).totalPinnedCids ===
      "number" &&
    typeof (obj.summary as Record<string, unknown>).collectedAt === "string" &&
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
  T extends NodeMetricsInternal | NodeMetricsSignable,
>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}
