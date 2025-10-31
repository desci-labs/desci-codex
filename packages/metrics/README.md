# @codex/metrics

Shared metrics types, validation, and utilities for the Codex project.

## Purpose

This package solves the format coordination problem between the producer (`packages/node`) and consumer (`packages/metrics_server`) sides of the metrics system. It provides:

- **Type Safety**: Shared TypeScript interfaces and Zod schemas for all metric formats
- **Canonical Serialization**: Deterministic JSON serialization for cryptographic signatures
- **Format Transformations**: Utilities to convert between internal and wire formats
- **Validation**: Runtime validation using Zod schemas
- **Signing & Verification**: Utilities for Ed25519 signature creation and validation

## Installation

```bash
pnpm add @codex/metrics
```

## Key Features

### 🔒 **Cryptographically Secure**
- Schema-validated deterministic JSON serialization ensures signature verification works reliably
- Ed25519 signature utilities with peer ID validation
- Protection against tampering and impersonation attacks

### 🎯 **Type Safe**
- Full TypeScript support with comprehensive type definitions
- Zod schemas for runtime validation
- Compile-time guarantees that producer and consumer use compatible formats

### 🔄 **Format Transformation**
- Seamless conversion between internal (nested) and wire (flat) formats
- Utilities for extracting signable data from complete payloads
- Support for storage format (without signatures)

### ✅ **Comprehensive Testing**
- 62 tests covering all functionality
- End-to-end integration tests
- Deterministic serialization validation
- Edge case and security scenario testing

## API Overview

### Types

```typescript
import type {
  NodeMetricsInternal,   // Nested format used internally by node
  NodeMetricsWire,       // Flat format for network transmission
  NodeMetricsSignable,   // Wire format without signature
  NodeMetricsStorage,    // Storage format (same as signable)
  Environment,           // "testnet" | "mainnet" | "local"
  ValidationResult,      // { isValid: boolean; error?: string }
} from "@codex/metrics";
```

### Schemas

```typescript
import {
  NodeMetricsWireSchema,
  NodeMetricsInternalSchema,
  NodeMetricsSignableSchema,
  EnvironmentSchema,
  SignatureSchema,
} from "@codex/metrics";

// Runtime validation
const validatedMetrics = NodeMetricsWireSchema.parse(inputData);
```

### Serialization

```typescript
import { canonicalJsonSerialize } from "@codex/metrics";

// Schema-validated deterministic JSON serialization for signing
const jsonString = canonicalJsonSerialize(metricsData);
const dataBytes = new TextEncoder().encode(jsonString);
```

### Transformations

```typescript
import {
  internalToWire,
  wireToInternal,
  extractSignableData,
  createWireFormat,
} from "@codex/metrics";

// Convert between formats
const wireFormat = internalToWire(internalMetrics);
const signableData = extractSignableData(wireFormat);
const completePayload = createWireFormat(signableData, signature);
```

### Signing & Validation

```typescript
import {
  signMetrics,
  validateMetricsSignature,
  validateMetricsStructure,
} from "@codex/metrics";

// Producer side (node)
const signedMetrics = await signMetrics(metricsData, privateKey);

// Consumer side (metrics_server)
const isValid = await validateMetricsSignature(receivedMetrics);
const structureValid = validateMetricsStructure(receivedMetrics);
```

## Usage Examples

### Producer (Node) Usage

```typescript
import {
  signMetrics,
  internalToWire,
  extractSignableData,
  type NodeMetricsInternal,
} from "@codex/metrics";

// Create internal metrics format
const internalMetrics: NodeMetricsInternal = {
  identity: {
    ipfs: peerId.toString(),
    ceramic: ceramicPeerId.toString(),
  },
  environment: "testnet",
  summary: {
    totalStreams: 42,
    totalPinnedCids: 24,
    collectedAt: new Date().toISOString(),
  },
  signature: [], // Will be populated after signing
};

// Transform to wire format and sign
const wireFormat = internalToWire(internalMetrics);
const signableData = extractSignableData(wireFormat);
const signedMetrics = await signMetrics(signableData, privateKey);

// Send signedMetrics over HTTP
await fetch('/api/v1/metrics/node', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(signedMetrics),
});
```

### Consumer (Metrics Server) Usage

```typescript
import {
  validateMetricsSignature,
  validateMetricsStructure,
  wireToStorage,
  NodeMetricsWireSchema,
} from "@codex/metrics";

// Validate incoming metrics
app.post('/api/v1/metrics/node', async (req, res) => {
  try {
    // Runtime schema validation
    const metrics = NodeMetricsWireSchema.parse(req.body);
    
    // Structure validation (redundant with schema but shows the API)
    const structureResult = validateMetricsStructure(metrics);
    if (!structureResult.isValid) {
      return res.status(400).json({ error: structureResult.error });
    }
    
    // Cryptographic signature validation
    const signatureResult = await validateMetricsSignature(metrics);
    if (!signatureResult.isValid) {
      return res.status(400).json({ error: signatureResult.error });
    }
    
    // Convert to storage format and save
    const storageData = wireToStorage(metrics);
    await database.writeNodeMetrics(storageData);
    
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Invalid metrics format' });
  }
});
```

## Architecture

The package is structured around three main data formats:

1. **Internal Format** (`NodeMetricsInternal`): Nested structure used by the node service
2. **Wire Format** (`NodeMetricsWire`): Flattened structure for network transmission
3. **Storage Format** (`NodeMetricsStorage`): Wire format without signature for database storage

The transformation flow:
```
Internal → Wire → Signing → Transmission → Validation → Storage
```

## Security Considerations

- **Schema Validation**: Input data is validated using Zod schemas before serialization
- **Deterministic Serialization**: JSON.stringify produces consistent output for the same data structure
- **Type Safety**: Prevents format mismatches that could break signature verification
- **Cryptographic Validation**: Ed25519 signature verification ensures data authenticity and integrity

## Testing

Run the comprehensive test suite:

```bash
pnpm test
```

The package includes:
- Unit tests for all functions
- Integration tests for producer→consumer flow
- Schema validation tests
- Security and edge case tests
- Deterministic serialization tests

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Watch mode for tests
pnpm test:watch
```

## Migration from Ad-hoc Format

This package replaces the manual format coordination between `packages/node` and `packages/metrics_server`. To migrate:

1. Install `@codex/metrics` in both packages
2. Replace manual type definitions with imports from this package
3. Use `signMetrics()` instead of manual signing logic
4. Use `validateMetricsSignature()` instead of manual validation
5. Use transformation utilities instead of the manual `metricsToPayload()` function

The package uses a simplified, schema-validated approach that eliminates the previous field ordering requirements.