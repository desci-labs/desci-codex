![DeSci Codex logotype](/codex.png)
# DeSci Codex - models and local test environment

This package contains ComposeDB models for the codex entities, together with scripts and config for setting up a local test environment and compiling composites.

## Getting started
Follow the instructions in the [repo root](/README.md) and run `make test`, and everything should be set up correctly.

### Editing models
Change models in the `composites` directory. When running `npm dev`, they will be automatically compiled and deployed.

### Adding models
Add the model file in the `composites` directory, and update [`scripts/composites.ts`](scripts/composites.ts) with the new model in the compile and deployment chain.

> The digits prefixing the file names indicate its level in the deployment DAG, as they may have dependencies on other models. So, all models starting with `1` has no dependencies. All starting with `2` have at least one dependency from the previous layer, and so on.
