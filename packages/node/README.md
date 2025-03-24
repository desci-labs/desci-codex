# CODEX Node
The CODEX Node is a P2P application that subscribes to and replicates data published on CODEX.
The goal of the service is to increase network resiliency, improve data availability, and
decentralise the storage of CODEX information.

It has a built-in IPFS client built with [Helia](https://github.com/ipfs/helia), which is used to
persist and announce publication manifests.

## Running


## TODO
- Bootstrap peer connection only works in docker, `run dev` fails to connect
    - But fetching over the network is successful, which is funky
