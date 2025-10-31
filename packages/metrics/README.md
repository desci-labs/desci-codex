# @codex/metrics

Shared metrics library for node data collection and server validation in the Codex P2P network.

## What's this for?

The node package collects metrics and sends them to the metrics server. This library handles the tricky parts - making sure both sides use the same data format, properly signing metrics with libp2p keys, and validating everything on the server side.

Before this library, we had duplicate type definitions and manual signing logic scattered across packages. Now it's all in one place.

## Features

- **Shared types**: Both node and server use the same TypeScript definitions
- **libp2p integration**: Uses Ed25519 keys and peer IDs for signatures  
- **Bulletproof validation**: Schema validation plus cryptographic verification
- **Simple API**: Just a few functions to handle signing and validation

## Installation

```bash
pnpm add @codex/metrics
```

## How it works

The basic flow is:

1. **Node side**: Collect metrics → sign with libp2p private key → send to server
2. **Server side**: Receive metrics → validate structure → verify signature → store

The key insight is that libp2p peer IDs contain public keys, so we can verify that metrics actually came from the claimed peer. No one can fake metrics from another node without their private key.

## Quick start

### For the node package (producing metrics)

```typescript
import { signMetrics } from "@codex/metrics";

const metricsData = {
  ipfsPeerId: peerId.toString(),
  ceramicPeerId: ceramicPeerId.toString(), 
  environment: "testnet",
  totalStreams: 42,
  totalPinnedCids: 24,
  collectedAt: new Date().toISOString(),
};

const signedMetrics = await signMetrics(metricsData, privateKey);
// Send signedMetrics to server
```

### For the metrics server (consuming metrics)

```typescript
import { validateMetricsSignature } from "@codex/metrics";

const result = await validateMetricsSignature(receivedMetrics);
if (result.isValid) {
  // Store metrics in database
} else {
  console.error("Invalid metrics:", result.error);
}
```

## Types

```typescript
import type {
  NodeMetricsInternal,   // Complete format with nested structure + signature
  NodeMetricsSignable,   // Just the data that gets signed (no signature field)
  Environment,           // "testnet" | "mainnet" | "local"
  ValidationResult,      // { isValid: boolean; error?: string }
} from "@codex/metrics";
```

## Other utilities

```typescript
import { 
  canonicalJsonSerialize,    // Deterministic JSON for signatures
  extractSignableData,       // Get data without signature 
  createInternalFormat,      // Build complete metrics object
  validateMetricsStructure,  // Just structure validation (no crypto)
} from "@codex/metrics";
```

## Complete examples

### Node package integration

```typescript
import { signMetrics, type NodeMetricsSignable } from "@codex/metrics";

async function collectAndSendMetrics() {
  // Gather your metrics data
  const metrics: NodeMetricsSignable = {
    ipfsPeerId: peerId.toString(),
    ceramicPeerId: ceramicPeerId.toString(),
    environment: "testnet", 
    totalStreams: await countStreams(),
    totalPinnedCids: await countPinnedCids(),
    collectedAt: new Date().toISOString(),
  };

  // Sign and send
  const signed = await signMetrics(metrics, privateKey);
  
  const response = await fetch('/api/v1/metrics/node', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signed),
  });
  
  if (!response.ok) {
    throw new Error(`Metrics submission failed: ${response.status}`);
  }
}
```

### Metrics server integration

```typescript
import { validateMetricsSignature, NodeMetricsInternalSchema } from "@codex/metrics";

app.post('/api/v1/metrics/node', async (req, res) => {
  try {
    // Parse and validate structure
    const metrics = NodeMetricsInternalSchema.parse(req.body);
    
    // Verify cryptographic signature
    const result = await validateMetricsSignature(metrics);
    if (!result.isValid) {
      return res.status(400).json({ error: result.error });
    }
    
    // Store in database (you can remove signature for storage)
    await db.metrics.create({
      data: {
        ipfsPeerId: metrics.identity.ipfs,
        ceramicPeerId: metrics.identity.ceramic,
        environment: metrics.environment,
        totalStreams: metrics.summary.totalStreams,
        totalPinnedCids: metrics.summary.totalPinnedCids,
        collectedAt: new Date(metrics.summary.collectedAt),
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Metrics validation failed:', error);
    res.status(400).json({ error: 'Invalid metrics' });
  }
});
```

## Data formats

There are just two formats to know about:

- **`NodeMetricsSignable`**: The raw data that gets signed (no signature field)
- **`NodeMetricsInternal`**: Complete metrics with nested structure and signature array

The signing process takes signable data, creates a deterministic JSON representation, signs it with Ed25519, then builds the complete internal format.

## Security notes

This library enforces some important security properties:

- **Peer ID verification**: Can't fake metrics from another node without their private key
- **Tamper detection**: Any modification to signed data will fail verification  
- **Schema validation**: Malformed data gets rejected before reaching crypto operations
- **Deterministic serialization**: Same data always produces same signature

The deterministic JSON serialization is crucial. If the node and server serialize data differently, signature verification breaks.

## Testing

```bash
pnpm test
```

We have tests covering:
- End-to-end signing and validation flows
- Schema validation edge cases  
- Security scenarios (tampering, impersonation)
- libp2p peer ID integration

## Development

```bash
pnpm install    # Install deps
pnpm build      # Build TypeScript  
pnpm test       # Run tests
```
