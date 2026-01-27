#!/usr/bin/env bash

# CODEX Development Environment Runner
# This script provides easy commands to run different development configurations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

function show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev          Run development services only (ceramic + codex-node) against testnet"
    echo "  dev-metrics  Run development services with metrics (ceramic + codex-node + metrics stack)"
    echo "  prod         Run against mainnet (ceramic + codex-node)"
    echo "  metrics      Run metrics stack only (postgres + metrics-server)"
    echo "  local        Run local development (inmemory ceramic + codex-node)"
    echo "  stop         Stop all running containers"
    echo "  logs         Show logs for running containers"
    echo ""
    echo "Examples:"
    echo "  $0 dev          # Start just ceramic and codex-node for development"
    echo "  $0 prod         # Start ceramic and codex-node against mainnet"
    echo "  $0 dev-metrics  # Start everything including metrics"
    echo "  $0 stop         # Stop all containers"
}

function run_dev() {
    echo "Starting development services (ceramic + codex-node)..."
    docker compose -f compose.dev.yaml up --build -d
    echo "✅ Development services started!"
    echo "  - Ceramic: http://localhost:5101"
    echo "  - Codex Node: http://localhost:3000"
}

function run_dev_metrics() {
    echo "Starting development services with metrics..."
    docker compose -f compose.dev-with-metrics.yaml up --build -d
    echo "✅ Development services with metrics started!"
    echo "  - Ceramic: http://localhost:5101"
    echo "  - Codex Node: http://localhost:3000"
    echo "  - Metrics Server: http://localhost:3001"
}

function run_prod() {
    echo "Starting production services (ceramic + codex-node against mainnet)..."
    docker compose -f compose.prod.yaml up --build -d
    echo "✅ Production services started!"
    echo "  - Ceramic: http://localhost:5101 (mainnet)"
    echo "  - Codex Node: http://localhost:3000"
}

function run_metrics() {
    echo "Starting metrics stack only..."
    docker compose -f compose.metrics.yml up --build -d
    echo "✅ Metrics stack started!"
    echo "  - Metrics Server: http://localhost:3001"
}

function run_local() {
    echo "Starting local development (inmemory)..."
    docker compose -f compose.yaml up --build -d
    echo "✅ Local development services started!"
    echo "  - Ceramic: http://localhost:5101"
    echo "  - Codex Node: http://localhost:3000"
}

function stop_all() {
    echo "Stopping all containers..."
    docker compose -p codex_nodes down 2>/dev/null || true
    echo "✅ All containers stopped!"
}

function show_logs() {
    echo "Showing logs for running containers..."
    docker compose -p codex_nodes logs -f
}

# Main script logic
case "${1:-}" in
    "dev")
        run_dev
        ;;
    "dev-metrics")
        run_dev_metrics
        ;;
    "prod")
        run_prod
        ;;
    "metrics")
        run_metrics
        ;;
    "local")
        run_local
        ;;
    "stop")
        stop_all
        ;;
    "logs")
        show_logs
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        echo "Error: Unknown command '$1'"
        echo ""
        show_usage
        exit 1
        ;;
esac
