# ComposeDB configuration
This is a rough take on model definitions for DeSci Nodes on Ceramic and ComposeDB,
based on a Ceramic demo at ETHDenver and snippets from Mark Krasner.

## Getting Started
1. Install your dependencies:

```bash
nvm use # ensure node 20 is selected according to .nvmrc
npm install
```

2. Generate your admin seed, admin did, and ComposeDB configuration file:

```bash
npm run generate
```

3. Finally, run your application in a new terminal:

```bash
npm run dev
```
- Open [http://localhost:3000](http://localhost:3000) to get to Nodes Home
- Open [http://localhost:5001](http://localhost:5001) for the GraphiQL interface

## Reset
To clean everything up, delete `local-data`. This is necessary when changing networks, for example.

## Tests
There is a test suite running through API operations demonstrating the functional protocol
requirements in an isolated ceramic instance not to dirty down the state, but can also be
run against the dev process. Not both at the same time though, because the ports overlap.

```bash
make test
```