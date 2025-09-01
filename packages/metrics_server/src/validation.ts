import { peerIdFromString } from "@libp2p/peer-id";
import logger from "./logger.js";

const log = logger.child({ module: "validation" });

export interface SignedNodeMetrics {
  ipfsPeerId: string;
  ceramicPeerId: string;
  environment: "testnet" | "mainnet" | "local";
  totalStreams: number;
  totalPinnedCids: number;
  collectedAt: string;
  signature: number[];
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates the cryptographic signature of node metrics.
 * This ensures that the metrics were actually signed by the peer ID claimed in the payload.
 *
 * @param metrics - The signed metrics payload from a node
 * @returns Promise<ValidationResult> - Whether the signature is valid
 */
export async function validateMetricsSignature(
  metrics: SignedNodeMetrics,
): Promise<ValidationResult> {
  try {
    // Extract the signature from the payload
    const { signature, ...dataToVerify } = metrics;

    if (!signature || !Array.isArray(signature) || signature.length === 0) {
      return {
        isValid: false,
        error: "Missing or invalid signature",
      };
    }

    // Convert the peer ID string to a peer ID object to get the public key
    let peerId;
    try {
      peerId = peerIdFromString(metrics.ipfsPeerId);
    } catch (error) {
      return {
        isValid: false,
        error: `Invalid peer ID format: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }

    if (!peerId.publicKey) {
      return {
        isValid: false,
        error: "Peer ID does not contain a public key",
      };
    }

    // Reconstruct the exact data that was signed
    // This must match the data structure used in the node's metrics.ts:64-66
    const dataBytes = new TextEncoder().encode(JSON.stringify(dataToVerify));

    // Convert signature array back to Uint8Array
    const signatureBytes = new Uint8Array(signature);

    // Verify the signature using the peer's public key
    const isValid = await peerId.publicKey.verify(dataBytes, signatureBytes);

    if (!isValid) {
      log.warn(
        { ipfsPeerId: metrics.ipfsPeerId },
        "Invalid signature detected for metrics payload",
      );
      return {
        isValid: false,
        error: "Cryptographic signature verification failed",
      };
    }

    log.debug(
      { ipfsPeerId: metrics.ipfsPeerId },
      "Metrics signature validated successfully",
    );

    return { isValid: true };
  } catch (error) {
    log.error(error, "Error during metrics signature validation");
    return {
      isValid: false,
      error: `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
