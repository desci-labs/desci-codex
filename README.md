![DeSci Codex logotype](./codex.png)

This repo contains a reference implementation for the next generation of the protocol, built on [Ceramic](https://ceramic.network/) and [ComposeDB](https://composedb.js.org/docs/0.5.x/introduction). It includes data models and an extensive test suite to ensure correct functionality, but also example data population and a GraphiQL interface to explore the protocol structure.

The repo consists of several packages:
- [the codex integration library](./packages/lib/README.md)
- [composedb models and test env](./packages/composedb/README.md)
- [a codex CLI](./packages/cli/README.md)


By default, the tests and scripts run against a local Ceramic/ComposeDB node with the bundled IPFS server, uses the `inmemory` network for anchoring, and writes all data and logs to `local-data`.

The protocol documentation can be found [here](https://codex.desci.com)!

## State of models
There is still iteration on the design of the models as we are starting with backwards-compatible rollout on the ResearchObject with intact manifests. As we experiment with putting more and more of the manifest content on streams, the model design will stabilise.

**Alpha** means that the model, and hence the ID, will likely change.
**Beta** means that the model is somewhat stable, but there may be an upgrade requiring a migration.
**Stable** means the model is stable, and if any change is necessary we are commited in solving for backward compatibility.

| Model                 | Status | ID (Clay)                                                       | ID (Mainnet) |
|-----------------------|--------|-----------------------------------------------------------------|--------------|
| ResearchObject        | beta   | kjzl6hvfrbw6cbe01it6hlcwopsv4cqrqysho4f1xd7rtqxew9yag3x2wxczhz0 | N/A          |
| Profile               | alpha  | kjzl6hvfrbw6cba0l4xuvi4ll36h3s21kcau1wpq51ha6k8ttc8yw5kzx2g40in | N/A          |
| Claim                 | alpha  | kjzl6hvfrbw6c6hz18jqthpsvvjvixg8xkvrec10l5nbwqc67vi6lvhgkc7j0ti | N/A          |
| Attestation           | alpha  | kjzl6hvfrbw6c9gw5pagxy4ig2f9lqpexycdl5lq9jfy11itm38f3nco4ud8699 | N/A          |
| ResearchComponent     | alpha  | kjzl6hvfrbw6c9mh61r73r6o7lfmo8u7d2ygka8yqgwn4wwtl45xsv51uds87dh | N/A          |
| SocialHandle          | alpha  | kjzl6hvfrbw6c6t1shl3fextieopqswv96xuhmfh4c3h66eqj3zx3ivddg9axq2 | N/A          |
| Annotation            | alpha  | kjzl6hvfrbw6c5j2xqk6s2hraoxs49pk1hfsrj6ht5tqmqhwupqarjvafx9l6n6 | N/A          |
| ContributorRelation   | alpha  | kjzl6hvfrbw6c5qmeyibuvf351c9gcpmbvjmclzgz74wwskd8pr3jzuy8anvz1h | N/A          |
| ReferenceRelation     | alpha  | kjzl6hvfrbw6cackjf6z5qcaz9zhh9sezssa7usx4r9rc7to5xowogxr3ssbpor | N/A          |
| ResearchField         | alpha  | kjzl6hvfrbw6caae58yly0aahfzqewu1dfhlc00042i08wg4anar5xj7lbahzz8 | N/A          |
| ResearchFieldRelation | alpha  | kjzl6hvfrbw6c7aug8sphy4eae684t9wbqb5g15r0grssurt51sllba689318co | N/A          |


## Getting started

1. Install dependencies:

```bash
nvm use # or otherwise ensure the use of node v20
npm ci # install deps
```

> At this point, `make test` can be run to automatically setup a local environment and run the test suite.

2. Generate your own seed, admin DID, and ComposeDB configuration file:

```bash
npm run -w packages/composedb generate
```

3. Finally, start the services:

```bash
npm run -w packages/composedb dev
```

This will start a composeDB node, compile the models into composites, and deploy the composites to a local network. Now, you can open [http://localhost:5001](http://localhost:5001) for the GraphiQL interface and explore the data models. This environment is what is being used in the tests.

> Without running this step, the composite runtime definitions will not be available and hence typescript may be temporarily sad

4. If you want to experiment with some actual queries, you can run this command to publish a bit of data from a couple of random DID's:

```bash
npm run -w packages/lib populate
```

After this is done, your GraphQL queries should return some actual data!


## Test suite

There is a test suite running through API operations demonstrating the functional protocol requirements, by generating random DID's and performing create and mutation operations. Before each run, it will remove the remains of the last test execution.

The test setup clones your user configuration, but changes storage to `local-data/ceramic-test` not to interfere with prepopulated data. It will refuse to run if `npm run dev` is already active.

```bash
make test
```

### Stop hung services
If the test doesn't exit nicely, there may be IPFS and Ceramic daemons still hanging around. When restarting the tests, it may nag about not wanting to clobber those services. If this happens, run:

```bash
make test-stop
```

## Reset

To reset to a clean state, deleting everything except generated seed and user config:

```bash
make clean
```

## Feedback

If you want to discuss any part of the protocol from a practical or theoretical perspective, come on in to our [Discord](https://discord.gg/A5P9fgB5Cf)! This is a community effort, and your thoughts and opinions will help shape its future.
