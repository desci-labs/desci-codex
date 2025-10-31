// Re-export types from schemas for backward compatibility
export type {
  Environment,
  NodeMetricsInternal,
  NodeMetricsWire,
  NodeMetricsStorage,
  NodeMetricsSignable,
} from "./schemas.js";

/**
 * Result of signature validation.
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}
