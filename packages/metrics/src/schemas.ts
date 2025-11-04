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
 * Schema for stream data with associated events
 */
export const StreamSchema = z.object({
  streamId: z.string().min(1),
  streamCid: z.string().min(1),
  eventIds: z.array(z.string().min(1)),
});

/**
 * Schema for the granular metrics format
 */
export const NodeMetricsGranularSchema = z.object({
  nodeId: z.string().min(1),
  peerId: z.string().min(1),
  environment: EnvironmentSchema,
  manifests: z.array(z.string().min(1)),
  streams: z.array(StreamSchema),
  collectedAt: z.string().datetime(),
  signature: SignatureSchema,
});

/**
 * Schema for signable granular metrics data (without signature)
 */
export const NodeMetricsSignableSchema = z.object({
  nodeId: z.string().min(1),
  peerId: z.string().min(1),
  environment: EnvironmentSchema,
  manifests: z.array(z.string().min(1)),
  streams: z.array(StreamSchema),
  collectedAt: z.string().datetime(),
});

/**
 * Infer TypeScript types from schemas
 */
export type Environment = z.infer<typeof EnvironmentSchema>;
export type Stream = z.infer<typeof StreamSchema>;
export type NodeMetricsGranular = z.infer<typeof NodeMetricsGranularSchema>;
export type NodeMetricsSignable = z.infer<typeof NodeMetricsSignableSchema>;
