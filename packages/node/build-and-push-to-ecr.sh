#! /usr/bin/env bash

set -euxo pipefail

docker build \
  -t codex-node:latest \
  -t 523044037273.dkr.ecr.us-east-2.amazonaws.com/codex-node:latest \
  -f Dockerfile \
  $(git rev-parse --show-toplevel)

aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 523044037273.dkr.ecr.us-east-2.amazonaws.com
docker push 523044037273.dkr.ecr.us-east-2.amazonaws.com/codex-node:latest
