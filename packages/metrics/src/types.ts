// Re-export types from schemas
export type {
  Environment,
  Stream,
  NodeMetricsGranular,
  NodeMetricsSignable,
} from "./schemas.js";

/**
 * Result of signature validation.
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}
