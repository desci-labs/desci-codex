![DeSci Codex logotype](../../codex.png)

# DeSci Codex - Integration Library

This package provides a typed API for interacting with Codex through Ceramic nodes (both legacy ComposeDB and the new Ceramic-one).

## Installation

```bash
pnpm add @desci-labs/desci-codex-lib
```

## Features

### Legacy ComposeDB API
The original API for interacting with ComposeDB nodes:
- GraphQL-based queries and mutations
- Support for ResearchObject, Profile, Claim, and Attestation models
- Stream-based operations

### Ceramic-one (C1) API
New high-performance API for Ceramic-one nodes:
- **FlightSQL queries** for efficient data retrieval
- **Stream client** for mutations and updates  
- **Historical state tracking** with version management
- **Batch operations** for multiple streams

## Usage

### Using Ceramic-one (C1)

#### Client Initialization

```typescript
import { 
  newFlightSqlClient,
  newStreamClient,
  DEFAULT_LOCAL_FLIGHT
} from '@desci-labs/desci-codex-lib/c1';
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';

// Initialize FlightSQL client for queries
const flightClient = newFlightSqlClient('http://localhost:5102');
// or use the local default: newFlightSqlClient(DEFAULT_LOCAL_FLIGHT);
// or use our public testnet node: newFlightSqlClient('https://ceramic-one-dev.desci.com:5102');

// Initialize stream client for mutations
const streamClient = newStreamClient({ 
  ceramic: 'http://localhost:5101' 
});
// or use our public testnet node: newStreamClient('https://ceramic-one-dev-rpc.desci.com:5101');

// Setup DID for authenticated operations
// Generate a secure 32-byte seed. Persist it securely; never commit to VCS.
import { randomBytes } from 'crypto';
const seed = randomBytes(32);

const provider = new Ed25519Provider(seed);
const did = new DID({ provider });
await did.authenticate();
```

#### Creating and Updating Research Objects
> Note: Manifests need to be created following the spec in `@desci-labs/desci-models`

```typescript
import { 
  createResearchObject,
  updateResearchObject 
} from '@desci-labs/desci-codex-lib/c1';
import { StreamID } from '@ceramic-sdk/identifiers';

// Create a new research object
const created = await createResearchObject(
  streamClient,
  did,
  {
    manifest: 'bafkmanifestcid123',
    title: 'Quantum Computing Research',
    license: 'CC-BY-4.0'
  }
);
console.log('Stream ID:', created.streamID);
console.log('Commit ID:', created.commitID);

// Update an existing research object
const updated = await updateResearchObject(
  streamClient,
  did,
  {
    id: created.streamID,
    title: 'Quantum Computing Research',
    manifest: 'bafkmanifestcid456',
    license: 'MIT'
  }
);
```

#### Querying Research Objects

```typescript
import { 
  listResearchObjects,
  listResearchObjectsWithHistory 
} from '@desci-labs/desci-codex-lib/c1';

// List all research objects (latest state only)
const objects = await listResearchObjects(flightClient);
objects.forEach(obj => {
  console.log(`${obj.title} (${obj.id})`);
  console.log(`  Owner: ${obj.owner}`);
  console.log(`  Manifest: ${obj.manifest}`);
  console.log(`  License: ${obj.license}`);
});

// Get full history for all research objects
const withHistory = await listResearchObjectsWithHistory(flightClient);
withHistory.forEach(obj => {
  console.log(`${obj.id} has ${obj.versions.length} versions`);
  obj.versions.forEach((v, i) => {
    console.log(`  v${i}: ${v.title} at ${v.time || 'unanchored'}`);
  });
});
```

#### Historical State Tracking

```typescript
import { 
  getStreamHistory,
  getStreamHistoryMultiple,
  getCommitState,
  getStreamStateAtVersion 
} from '@desci-labs/desci-codex-lib/c1';

// Get complete history of a single stream
const history = await getStreamHistory(
  flightClient, 
  'kjzl6kcym7w8y5...'
);
console.log(`Stream ${history.id} owned by ${history.owner}`);
history.versions.forEach((version, index) => {
  console.log(`Version ${index}:`);
  console.log(`  Commit: ${version.version}`);
  console.log(`  Time: ${version.time ? new Date(version.time) : 'unanchored'}`);
  console.log(`  Title: ${version.title}`);
});

// Get history for multiple streams at once
const multiHistory = await getStreamHistoryMultiple(
  flightClient,
  ['kjzl6kcym7w8y5...', 'kjzl6kcym7w8y6...']
);

// Get state at a specific commit
const commitState = await getCommitState(
  flightClient,
  'k3y52l7qbv1fry...'
);
console.log('State at commit:', commitState.state);

// Get state at a specific version number (0-indexed)
const versionState = await getStreamStateAtVersion(
  flightClient,
  'kjzl6kcym7w8y5...',
  2 // Get the 3rd version
);
console.log(`Version 2 title: ${versionState.state.title}`);
```

#### Raw SQL Queries

```typescript
import { 
  instantQuery,
  allResearchObjectsQuery,
  streamHistoryQuery,
  modelHistoryQuery,
  commitStateQuery
} from '@desci-labs/desci-codex-lib/c1';
import { StreamID, CommitID } from '@ceramic-sdk/identifiers';

// Execute custom SQL queries
const customResults = await instantQuery(
  flightClient,
  `SELECT * FROM event_states WHERE controller = 'did:pkh:eip155:1:0x...' LIMIT 10`
);

// Use pre-built SQL query builders
const streamId = StreamID.fromString('kjzl...');
const historySQL = streamHistoryQuery(streamId);
const results = await instantQuery(flightClient, historySQL);

// Query all events for a given model
const modelSQL = modelHistoryQuery(); // Uses default ResearchObject model
const modelResults = await instantQuery(flightClient, modelSQL);

// Query a specific commit
const commitId = CommitID.fromString('k3y52l7qbv1fry...');
const commitSQL = commitStateQuery(commitId);
const commitResult = await instantQuery(flightClient, commitSQL);
```

#### Type Definitions

```typescript
import type { 
  ResearchObject,
  ResearchObjectHistory,
  WithMeta,
  NodeIDs 
} from '@desci-labs/desci-codex-lib/types';

// ResearchObject shape
interface ResearchObject {
  manifest: string;  // IPFS CID
  title: string;
  license: string;
  metadata?: string; // Optional metadata CID
}

// WithMeta adds tracking fields
interface WithMeta<T> extends T {
  id: string;       // Stream ID
  version: string;  // Commit ID
  owner: string;    // Controller DID
}

// History includes all versions
interface ResearchObjectHistory {
  id: string;
  owner: string;
  manifest: string; // Latest manifest
  versions: Array<{
    version: string;           // Commit ID
    time: number | undefined;  // Anchor timestamp
    manifest: string;
    title: string;
    license: string;
  }>;
}
```

### Using Legacy ComposeDB
> Note: this only works if you connect the client to a js-ceramic node

```typescript
import { newComposeClient } from '@desci-labs/desci-codex-lib';

const client = await newComposeClient('http://localhost:7007');
// Use existing GraphQL-based operations
```

## Testing

```bash
# Test Ceramic-one functionality
pnpm run test:c1

# Test legacy ComposeDB (requires admin seed)
pnpm run test:root

# Run all tests via repo root
make test
```

## Development

This library is part of the Codex monorepo and uses pnpm for package management. See the [root README](../../README.md) for development setup instructions.
