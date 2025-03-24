![DeSci Codex logotype](/codex.png)
# DeSci Codex Models

This package contains tooling for managing models with ceramic-one.

## Registering interests
For a ceramic node to start indexing a model, one needs to register interest.

To do this, set the `CERAMIC_ONE_RPC_URL` in `.env` or an env variable and run:
```bash
pnpm run register
```

The `index.ts` file does this automatically if run as a script, but you can also call
the corresponding function when imported as a lib:
```ts
await registerModelInterests(CERAMIC_ONE_RPC_URL);
```