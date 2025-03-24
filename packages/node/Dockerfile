###################
### Build stage ###
###################
FROM node:20-slim AS builder

# Install pnpm
RUN corepack enable && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack prepare pnpm@10 --activate

WORKDIR /build

# Copy all files needed for build
COPY . .

# First install ALL dependencies (including devDependencies)
RUN pnpm install --frozen-lockfile

# Build while we still have dev dependencies
RUN pnpm --filter @desci-labs/desci-codex-node build

# Now create the production deployment (which will exclude devDependencies)
RUN pnpm deploy --filter @desci-labs/desci-codex-node --prod /prod

########################
### Production stage ###
########################
FROM node:20-slim

# Install utils
RUN apt-get update && apt-get install -y curl jq socat less vim

# Install pnpm
RUN corepack enable && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack prepare pnpm@10 --activate

# Create non-root user
RUN groupadd -r codex && useradd -r -g codex codex

# Create and set permissions for cache directory
RUN mkdir -p /home/codex/.cache/node/corepack && \
    chown -R codex:codex /home/codex/.cache

WORKDIR /app

# Copy the production deployment
COPY --chown=codex:codex --from=builder /prod .

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Switch to non-root user
USER codex

# Expose ports
EXPOSE 3000
EXPOSE 4001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Labels
LABEL org.opencontainers.image.source="https://github.com/desci-labs/desci-codex" \
      org.opencontainers.image.description="DeSci CODEX Node" \
      org.opencontainers.image.licenses="MIT"

# Start the application
CMD ["pnpm", "start"] 