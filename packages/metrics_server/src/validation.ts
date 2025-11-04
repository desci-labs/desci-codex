import {
  validateMetricsSignature as validateSignature,
  validateMetricsStructure as validateStructure,
} from "@desci-labs/desci-codex-metrics";

// Re-export the library functions for backwards compatibility
export const validateMetricsSignature = validateSignature;
export const validateMetricsStructure = validateStructure;
