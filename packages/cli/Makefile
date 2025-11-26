.PHONY: build dev install link unlink clean test

# Build the CLI
build:
	pnpm build

# Run in development mode
dev:
	pnpm dev $(ARGS)

# Install dependencies
install:
	pnpm install

# Link CLI globally for local testing
link:
	pnpm build && npm link

# Unlink CLI
unlink:
	npm unlink -g @desci-labs/codex-cli

# Clean build artifacts
clean:
	rm -rf dist node_modules

# Run tests (placeholder)
test:
	@echo "No tests configured yet"

# Help
help:
	@echo "Available commands:"
	@echo "  make build    - Build the CLI"
	@echo "  make dev      - Run in development mode"
	@echo "  make install  - Install dependencies"
	@echo "  make link     - Link CLI globally for testing"
	@echo "  make unlink   - Unlink CLI"
	@echo "  make clean    - Clean build artifacts"


