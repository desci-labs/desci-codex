# Protocol V2 reference implementation
This repo contains a reference implementation for the next generation of the protocol, built on [Ceramic](https://ceramic.network/) and [ComposeDB](https://composedb.js.org/docs/0.5.x/introduction). It includes data models and an extensive test suite to ensure correct functionality, but also example data population and a GraphiQL interface to explore the protocol structure.

By default, the application runs a local Ceramic/ComposeDB node with the bundled IPFS server, uses the `inmemory` network for anchoring, and writes all data and logs to `local-data`.

## Getting started

1. Install dependencies:

```bash
nvm use # or otherwise ensure the use of node v20
npm ci # install deps
```

2. Generate your own seed, admin DID, and ComposeDB configuration file:

```bash
npm run generate
```

3. Finally, start the services:

```bash
npm run dev
```

Now you can open [http://localhost:5001](http://localhost:5001) for the GraphiQL interface and explore the data models.

## Test suite

There is a test suite running through API operations demonstrating the functional protocol
requirements. This clones your user configuration, but changes storage to `local-data/ceramic-test` not to interfere with prepopulated data. Do make sure to stop `npm run dev` before executing tests.

```bash
make test
```

## Reset

To reset to a clean state, deleting everything except generated seed and user config:

```bash
make clean
```
