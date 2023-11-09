# DeSci CODEX reference implementation

This repo contains a reference implementation for the next generation of the protocol, built on [Ceramic](https://ceramic.network/) and [ComposeDB](https://composedb.js.org/docs/0.5.x/introduction). It includes data models and an extensive test suite to ensure correct functionality, but also example data population and a GraphiQL interface to explore the protocol structure.

By default, the application runs a local Ceramic/ComposeDB node with the bundled IPFS server, uses the `inmemory` network for anchoring, and writes all data and logs to `local-data`.

The protocol documentation can be found [here](pls-replace-me)!

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

This will start a composeDB node, compile the models into composites, and deploy the composites to a local network. Now, you can open [http://localhost:5001](http://localhost:5001) for the GraphiQL interface and explore the data models.

4. If you want to experiment with some actual queries, you can run this command to publish a bit of data from a couple of random DID's:

```bash
npm run populate
```

After this is done, your GraphQL queries should return actual information.


## Test suite

There is a test suite running through API operations demonstrating the functional protocol requirements, by generating random DID's and performing create and mutation operations. Before each run, it will remove the remains of the last test execution.

The test setup clones your user configuration, but changes storage to `local-data/ceramic-test` not to interfere with prepopulated data. It will refuse to run if `npm run dev` is already active.

```bash
make test
```

## Reset

To reset to a clean state, deleting everything except generated seed and user config:

```bash
make clean
```

## Feedback

If you want to discuss any part of the protocol from a practical or theoretical perspective, come on in to our [Discord](https://discord.gg/A5P9fgB5Cf)! This is a community effort, and your thoughts and opinions will help shape its future.
