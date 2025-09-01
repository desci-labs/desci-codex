![DeSci Codex logotype](/codex.png)
# DeSci Codex Models

This package contains tooling for managing models with ceramic-one.

## Registering interests
For a ceramic node to start indexing a model, one needs to register interest.

As a binary:
```bash
CERAMIC_ONE_RPC_URL="http://localhost:5101" npx @desci-labs/desci-codex-models register
```

Or use as a lib:
```ts
await registerModelInterests(CERAMIC_ONE_RPC_URL);
```

## Deploying models
For a private Ceramic node, you can use the lib to deploy the required models.

As a binary:
```bash
CERAMIC_ONE_RPC_URL="http://localhost:5101" PRIVATE_KEY=abc123... npx @desci-labs/desci-codex-models deploy
```

As a lib:
```ts
await deployModels(CERAMIC_ONE_RPC_URL, did);
```
