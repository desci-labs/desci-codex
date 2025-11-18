#! /usr/bin/env bash

# build docker images and push to ECR
set -euxo pipefail

docker build \
  -t codex-metrics-server:latest \
  -t 523044037273.dkr.ecr.us-east-2.amazonaws.com/codex-metrics-server:latest \
  -f Dockerfile \
  $(git rev-parse --show-toplevel)

aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 523044037273.dkr.ecr.us-east-2.amazonaws.com
docker push 523044037273.dkr.ecr.us-east-2.amazonaws.com/codex-metrics-server:latest
