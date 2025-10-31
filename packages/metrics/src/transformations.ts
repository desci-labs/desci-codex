import type {
  NodeMetricsInternal,
  NodeMetricsWire,
  NodeMetricsStorage,
  NodeMetricsSignable,
} from "./types.js";

/**
 * Transforms internal metrics format to wire format for transmission.
 * This flattens the nested structure into a flat object.
 *
 * @param internal - The internal metrics format
 * @returns The wire format suitable for transmission
 */
export function internalToWire(internal: NodeMetricsInternal): NodeMetricsWire {
  return {
    ipfsPeerId: internal.identity.ipfs,
    ceramicPeerId: internal.identity.ceramic,
    environment: internal.environment,
    totalStreams: internal.summary.totalStreams,
    totalPinnedCids: internal.summary.totalPinnedCids,
    collectedAt: internal.summary.collectedAt,
    signature: internal.signature,
  };
}

/**
 * Transforms wire format back to internal format.
 * This reconstructs the nested structure from the flat wire format.
 *
 * @param wire - The wire format metrics
 * @returns The internal format with nested structure
 */
export function wireToInternal(wire: NodeMetricsWire): NodeMetricsInternal {
  return {
    identity: {
      ipfs: wire.ipfsPeerId,
      ceramic: wire.ceramicPeerId,
    },
    environment: wire.environment,
    summary: {
      totalStreams: wire.totalStreams,
      totalPinnedCids: wire.totalPinnedCids,
      collectedAt: wire.collectedAt,
    },
    signature: wire.signature,
  };
}

/**
 * Extracts signable data from wire format by removing the signature field.
 *
 * @param wire - The complete wire format with signature
 * @returns The signable data without signature
 */
export function extractSignableData(
  wire: NodeMetricsWire,
): NodeMetricsSignable {
  const { signature, ...signable } = wire;
  return signable;
}

/**
 * Converts wire format to storage format by removing the signature.
 *
 * @param wire - The wire format with signature
 * @returns The storage format without signature
 */
export function wireToStorage(wire: NodeMetricsWire): NodeMetricsStorage {
  const { signature, ...storage } = wire;
  return storage;
}

/**
 * Creates wire format from signable data and signature.
 *
 * @param signable - The data that was signed
 * @param signature - The signature array
 * @returns Complete wire format with signature
 */
export function createWireFormat(
  signable: NodeMetricsSignable,
  signature: number[],
): NodeMetricsWire {
  return {
    ...signable,
    signature,
  };
}

/**
 * Validates that a wire format object has all required fields.
 *
 * @param data - The object to validate
 * @returns True if the object is a valid wire format
 */
export function isValidWireFormat(data: unknown): data is NodeMetricsWire {
  if (!data || typeof data !== "object") {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.ipfsPeerId === "string" &&
    typeof obj.ceramicPeerId === "string" &&
    ["testnet", "mainnet", "local"].includes(obj.environment as string) &&
    typeof obj.totalStreams === "number" &&
    typeof obj.totalPinnedCids === "number" &&
    typeof obj.collectedAt === "string" &&
    Array.isArray(obj.signature) &&
    obj.signature.every((v: unknown) => typeof v === "number")
  );
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
    typeof (obj.identity as any).ipfs === "string" &&
    typeof (obj.identity as any).ceramic === "string" &&
    ["testnet", "mainnet", "local"].includes(obj.environment as string) &&
    obj.summary !== null &&
    typeof obj.summary === "object" &&
    typeof (obj.summary as any).totalStreams === "number" &&
    typeof (obj.summary as any).totalPinnedCids === "number" &&
    typeof (obj.summary as any).collectedAt === "string" &&
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
  T extends NodeMetricsInternal | NodeMetricsWire | NodeMetricsStorage,
>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}
