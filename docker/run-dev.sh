#!/bin/bash

# CODEX Development Environment Runner
# This script provides easy commands to run different development configurations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

function show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev          Run development services only (ceramic + codex-node)"
    echo "  dev-metrics  Run development services with metrics (ceramic + codex-node + metrics stack)"
    echo "  metrics      Run metrics stack only (postgres + metrics-server + grafana)"
    echo "  local        Run local development (inmemory ceramic + codex-node)"
    echo "  stop         Stop all running containers"
    echo "  logs         Show logs for running containers"
    echo ""
    echo "Examples:"
    echo "  $0 dev          # Start just ceramic and codex-node for development"
    echo "  $0 dev-metrics  # Start everything including metrics"
    echo "  $0 stop         # Stop all containers"
}

function run_dev() {
    echo "Starting development services (ceramic + codex-node)..."
    docker compose -f compose.dev.yaml up -d
    echo "✅ Development services started!"
    echo "  - Ceramic: http://localhost:5101"
    echo "  - Codex Node: http://localhost:3000"
}

function run_dev_metrics() {
    echo "Starting development services with metrics..."
    docker compose -f compose.dev-with-metrics.yaml up -d
    echo "✅ Development services with metrics started!"
    echo "  - Ceramic: http://localhost:5101"
    echo "  - Codex Node: http://localhost:3000"
    echo "  - Metrics Server: http://localhost:3001"
    echo "  - Grafana: http://localhost:3002 (admin/admin)"
}

function run_metrics() {
    echo "Starting metrics stack only..."
    docker compose -f compose.metrics.yml up -d
    echo "✅ Metrics stack started!"
    echo "  - Metrics Server: http://localhost:3001"
    echo "  - Grafana: http://localhost:3002 (admin/admin)"
}

function run_local() {
    echo "Starting local development (inmemory)..."
    docker compose -f compose.yaml up -d
    echo "✅ Local development services started!"
    echo "  - Ceramic: http://localhost:5101"
    echo "  - Codex Node: http://localhost:3000"
}

function stop_all() {
    echo "Stopping all containers..."
    docker compose -f compose.yaml down 2>/dev/null || true
    docker compose -f compose.dev.yaml down 2>/dev/null || true
    docker compose -f compose.dev-with-metrics.yaml down 2>/dev/null || true
    docker compose -f compose.metrics.yml down 2>/dev/null || true
    echo "✅ All containers stopped!"
}

function show_logs() {
    echo "Showing logs for running containers..."
    docker compose -f compose.yaml logs -f 2>/dev/null || \
    docker compose -f compose.dev.yaml logs -f 2>/dev/null || \
    docker compose -f compose.dev-with-metrics.yaml logs -f 2>/dev/null || \
    docker compose -f compose.metrics.yml logs -f 2>/dev/null || \
    echo "No running containers found"
}

# Main script logic
case "${1:-}" in
    "dev")
        run_dev
        ;;
    "dev-metrics")
        run_dev_metrics
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
