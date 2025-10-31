import { peerIdFromString } from "@libp2p/peer-id";
import type { ValidationResult, NodeMetricsWire } from "./types.js";
import { NodeMetricsWireSchema } from "./schemas.js";
import { canonicalJsonSerialize } from "./serialization.js";
import { extractSignableData } from "./transformations.js";
import { signatureFromArray } from "./signing.js";
import { ZodError } from "zod";
import { mapZodErrorToUserMessage } from "./error-mapping.js";
import { ERROR_MESSAGES } from "./constants.js";

/**
 * Validates the cryptographic signature of node metrics.
 * This ensures that the metrics were actually signed by the peer ID claimed in the payload.
 *
 * @param metrics - The signed metrics payload
 * @returns Promise<ValidationResult> - Whether the signature is valid
 */
export async function validateMetricsSignature(
  metrics: NodeMetricsWire,
): Promise<ValidationResult> {
  try {
    // Validate signature presence
    if (
      !metrics.signature ||
      !Array.isArray(metrics.signature) ||
      metrics.signature.length === 0
    ) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.MISSING_SIGNATURE,
      };
    }

    // Parse the peer ID to get the public key
    let peerId;
    try {
      peerId = peerIdFromString(metrics.ipfsPeerId);
    } catch (error) {
      return {
        isValid: false,
        error: `${ERROR_MESSAGES.INVALID_PEER_ID}: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }

    // Check if peer ID contains a public key
    if (!peerId.publicKey) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.NO_PUBLIC_KEY,
      };
    }

    // Extract the data that was signed
    const signableData = extractSignableData(metrics);

    // Recreate the exact bytes that were signed
    const dataJson = canonicalJsonSerialize(signableData);
    const dataBytes = new TextEncoder().encode(dataJson);

    // Convert signature back to Uint8Array
    const signatureBytes = signatureFromArray(metrics.signature);

    // Verify the signature using the peer's public key
    const isValid = await peerId.publicKey.verify(dataBytes, signatureBytes);

    if (!isValid) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.SIGNATURE_VERIFICATION_FAILED,
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Validates metrics data structure without checking the signature.
 * This performs schema validation to ensure all required fields are present and valid.
 *
 * @param metrics - The metrics to validate
 * @returns ValidationResult indicating if the structure is valid
 */
export function validateMetricsStructure(metrics: unknown): ValidationResult {
  try {
    NodeMetricsWireSchema.parse(metrics);
    return { isValid: true };
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      const errorMessage = mapZodErrorToUserMessage(firstError);

      return {
        isValid: false,
        error: errorMessage,
      };
    }

    return {
      isValid: false,
      error:
        "Validation error: " +
        (error instanceof Error ? error.message : "Unknown error"),
    };
  }
}
