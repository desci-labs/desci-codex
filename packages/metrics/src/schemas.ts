import { z } from "zod";
import { ENVIRONMENTS, BYTE_MIN, BYTE_MAX } from "./constants.js";

/**
 * Environment schema
 */
export const EnvironmentSchema = z.enum(ENVIRONMENTS);

/**
 * Signature schema - array of bytes (0-255)
 */
export const SignatureSchema = z.array(
  z.number().int().min(BYTE_MIN).max(BYTE_MAX),
);

/**
 * Schema for the internal metrics format used by the node service
 */
export const NodeMetricsInternalSchema = z.object({
  identity: z.object({
    ipfs: z.string().min(1),
    ceramic: z.string().min(1),
  }),
  environment: EnvironmentSchema,
  summary: z.object({
    totalStreams: z.number().int().min(0),
    totalPinnedCids: z.number().int().min(0),
    collectedAt: z.string().datetime(),
  }),
  signature: SignatureSchema,
});

/**
 * Schema for signable metrics data (without signature)
 */
export const NodeMetricsSignableSchema = z.object({
  ipfsPeerId: z.string().min(1),
  ceramicPeerId: z.string().min(1),
  environment: EnvironmentSchema,
  totalStreams: z.number().int().min(0),
  totalPinnedCids: z.number().int().min(0),
  collectedAt: z.string().datetime(),
});

/**
 * Infer TypeScript types from schemas
 */
export type Environment = z.infer<typeof EnvironmentSchema>;
export type NodeMetricsInternal = z.infer<typeof NodeMetricsInternalSchema>;
export type NodeMetricsSignable = z.infer<typeof NodeMetricsSignableSchema>;
