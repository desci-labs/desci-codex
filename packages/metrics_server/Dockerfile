###################
### Build stage ###
###################
FROM node:22-slim AS builder

# Install pnpm
RUN corepack enable && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack prepare pnpm@10.8.0 --activate

WORKDIR /build

# Copy all files needed for build
COPY . .

# First install ALL dependencies (including devDependencies)
RUN pnpm install --frozen-lockfile

# Build dependencies first, then the metrics server
RUN pnpm --filter @desci-labs/desci-codex-metrics build
RUN pnpm --filter @desci-labs/desci-codex-node-metrics build

# Now create the production deployment (which will exclude devDependencies)
RUN pnpm deploy --prod --filter @desci-labs/desci-codex-node-metrics /prod

########################
### Production stage ###
########################
FROM node:22-slim AS final

# Install utils
RUN apt-get update && apt-get install -y curl jq socat less vim dumb-init && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack prepare pnpm@10.8.0 --activate

# Create non-root user
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

# Create app directory with flexible permissions
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /prod .

# Create necessary directories and set permissions
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Set NODE_ENV
ENV NODE_ENV=production \
    PORT=3001

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

LABEL org.opencontainers.image.source="https://github.com/desci-labs/desci-codex" \
    org.opencontainers.image.description="DeSci CODEX Metrics Server" \
    org.opencontainers.image.licenses="MIT"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
