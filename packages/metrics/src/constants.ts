/**
 * Constants used throughout the metrics package
 */

// Signature byte limits
export const BYTE_MIN = 0;
export const BYTE_MAX = 255;

// Supported environments
export const ENVIRONMENTS = ["testnet", "mainnet", "local"] as const;

// Error messages
export const ERROR_MESSAGES = {
  MISSING_SIGNATURE: "Missing or invalid signature",
  INVALID_PEER_ID: "Invalid peer ID format",
  NO_PUBLIC_KEY: "Peer ID does not contain a public key",
  SIGNATURE_VERIFICATION_FAILED: "Cryptographic signature verification failed",
  METRICS_MUST_BE_OBJECT: "Metrics must be an object",
  SIGNATURE_BYTES_ERROR: "signature must be an array of bytes (numbers 0-255)",
  NON_EMPTY_STRING: "must be a non-empty string",
  NON_NEGATIVE_NUMBER: "must be a non-negative number",
  VALID_ISO_DATE: "must be a valid ISO date string",
  MUST_BE_STRING: "must be a string",
  MUST_BE_ARRAY: "must be an array",
  ENVIRONMENT_VALUES: "environment must be one of: testnet, mainnet, local",
  MISSING_FIELD: "Missing required field",
} as const;
