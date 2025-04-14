###################
### Build stage ###
###################
FROM node:20-slim AS builder

# Install pnpm
RUN corepack enable && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack prepare pnpm@10.8.0 --activate

WORKDIR /build

# Copy all files needed for build
COPY . .

# First install ALL dependencies (including devDependencies)
RUN pnpm install --frozen-lockfile

# Build while we still have dev dependencies
# RUN pnpm --filter @desci-labs/desci-codex-models build
# RUN ls -lA /build/packages/models/dist
RUN pnpm --filter @desci-labs/desci-codex-node build

# Now create the production deployment (which will exclude devDependencies)
RUN pnpm deploy --prod --filter @desci-labs/desci-codex-node /prod

########################
### Production stage ###
########################
FROM node:20-slim AS final

# Install utils
RUN apt-get update && apt-get install -y curl jq socat less vim

# Install pnpm
RUN corepack enable && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack prepare pnpm@10.8.0 --activate

# Create app directory with flexible permissions
WORKDIR /app
COPY --from=builder /prod .

# Set NODE_ENV
ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000
EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

LABEL org.opencontainers.image.source="https://github.com/desci-labs/desci-codex" \
      org.opencontainers.image.description="DeSci CODEX Node" \
      org.opencontainers.image.licenses="MIT"

CMD ["pnpm", "start"]
