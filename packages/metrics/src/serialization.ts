import type { NodeMetricsSignable } from "./types.js";
import { NodeMetricsSignableSchema } from "./schemas.js";

/**
 * Canonically serializes metrics data for signing and verification.
 * Validates input data and produces deterministic JSON output.
 *
 * @param data - The metrics data to serialize
 * @returns The canonical JSON string representation
 */
export function canonicalJsonSerialize(data: NodeMetricsSignable): string {
  // Validate the input data first
  const validatedData = NodeMetricsSignableSchema.parse(data);

  // JSON.stringify produces deterministic output for the same object structure
  return JSON.stringify(validatedData);
}
