# Multi-stage build for production
FROM node:22-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy workspace configuration and lockfile
COPY pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package.json files
COPY package.json ./
COPY packages/metrics_server/package.json ./packages/metrics_server/

# Install dependencies
RUN pnpm install

# Copy source code
COPY packages/metrics_server ./packages/metrics_server

# Build the application
WORKDIR /app/packages/metrics_server
RUN pnpm build

# Production stage
FROM node:22-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and install production dependencies
COPY --from=builder /app/packages/metrics_server/package.json ./
RUN pnpm install --prod

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/packages/metrics_server/dist ./dist

# Create necessary directories and set permissions
RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
