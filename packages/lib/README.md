![DeSci Codex logotype](../../codex.png)

# DeSci Codex - Integration library
This package implements a typed API for interacting directly with Codex, by
talking directly with a Ceramic and/or ComposeDB node.

## Installation
Install as dependency:

> Note: this package is currently not automatically published, but this will
  work regardless for the other packages inside the repo (`-composedb` and `-cli`).

```bash
npm install @desci-labs/desci-codex-lib
```

## Usage
Most functions require passing in a Ceramic or composeDB client, which can be
instantiated using the tools in `clients.ts`. Without explicit configuration,
the clients will default to a Ceramic node at `localhost:7007`.

Do note that when running against a local node, you likely want to compile
and deploy the composites in `desci-codex-composedb`.

### Tests
The test suite depends on the models in `desci-codex-composedb`, and are
easiest to invoke my running `make test` in the repo root instead of here.
