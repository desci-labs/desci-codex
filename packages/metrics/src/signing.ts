import type { Ed25519PrivateKey } from "@libp2p/interface";
import type { NodeMetricsSignable, NodeMetricsInternal } from "./types.js";
import { NodeMetricsSignableSchema } from "./schemas.js";
import { canonicalJsonSerialize } from "./serialization.js";
import { createInternalFormat } from "./transformations.js";

/**
 * Signs metrics data using the provided private key.
 *
 * @param data - The metrics data to sign (without signature field)
 * @param privateKey - The Ed25519 private key for signing
 * @returns The signed metrics in internal format
 */
export async function signMetrics(
  data: NodeMetricsSignable,
  privateKey: Ed25519PrivateKey,
): Promise<NodeMetricsInternal> {
  // Validate input data first
  const validatedData = NodeMetricsSignableSchema.parse(data);

  // Serialize the data canonically for signing
  const dataJson = canonicalJsonSerialize(validatedData);
  const dataBytes = new TextEncoder().encode(dataJson);

  // Sign the data
  const signatureBytes = await privateKey.sign(dataBytes);

  // Convert signature to number array for JSON serialization
  const signature = Array.from(signatureBytes);

  // Create the complete internal format with signature
  return createInternalFormat(validatedData, signature);
}

/**
 * Creates the exact bytes that need to be signed for metrics.
 * This is useful for testing and verification.
 *
 * @param data - The metrics data to prepare for signing
 * @returns The bytes that should be signed
 */
export function prepareSignableBytes(data: NodeMetricsSignable): Uint8Array {
  // Validate input data first
  const validatedData = NodeMetricsSignableSchema.parse(data);
  const dataJson = canonicalJsonSerialize(validatedData);
  return new TextEncoder().encode(dataJson);
}

/**
 * Converts a signature from Uint8Array to the JSON-serializable array format.
 *
 * @param signature - The signature as Uint8Array
 * @returns The signature as a number array
 */
export function signatureToArray(signature: Uint8Array): number[] {
  return Array.from(signature);
}

/**
 * Converts a signature from the JSON array format back to Uint8Array.
 *
 * @param signature - The signature as a number array
 * @returns The signature as Uint8Array
 */
export function signatureFromArray(signature: number[]): Uint8Array {
  return new Uint8Array(signature);
}
