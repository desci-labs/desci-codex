# Codex Network Status Dashboard

A modern web application for visualizing the health and status of the Codex Network.

## Features

- **Real-time Network Overview**: Monitor active nodes, manifests, streams, and events
- **Node Management**: View detailed information about each node in the network
- **Data Visualization**: Interactive charts showing network activity over time
- **Dark Mode Support**: Toggle between light and dark themes
- **Auto-refresh**: Configurable refresh intervals for real-time updates

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **TanStack Query** for efficient data fetching and caching
- **TanStack Router** for type-safe routing
- **Zustand** for global state management
- **Tailwind CSS** with shadcn/ui components
- **Recharts** for data visualization

## Prerequisites

- Node.js >= 20
- pnpm >= 10
- PostgreSQL database with Codex metrics data (using devenv credentials from metrics_server/.env)

## Installation

```bash
# Install dependencies
pnpm install
```

## Development

```bash
# Start both API server and client (recommended)
pnpm dev

# Or start them separately:
pnpm dev:api    # API server on port 3004
pnpm dev:client # Vite dev server on port 3000
```

The application will be available at http://localhost:3000
The API server runs on http://localhost:3004

## Building

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Configuration

The app includes its own API server that connects directly to the PostgreSQL database using the credentials:
- Host: localhost
- Port: 5432  
- Database: codex_metrics
- User: postgres
- Password: postgres

The Vite dev server proxies `/api` requests to the API server on port 3004.

## API Endpoints

The application provides the following API endpoints:

- `GET /api/stats` - Network statistics and time series data
- `GET /api/nodes` - List of all nodes
- `GET /api/nodes/:nodeId` - Detailed node information
- `GET /api/manifests` - List of all manifests
- `GET /api/streams` - List of all streams
- `GET /health` - Health check endpoint

## Project Structure

```
api/
└── server.js     # Express API server with direct database access
src/
├── api/          # API client and service functions
├── components/   # React components
│   ├── ui/       # Reusable UI components (shadcn/ui)
│   └── layout/   # Layout components
├── hooks/        # Custom React hooks
├── routes/       # TanStack Router route definitions
├── store/        # Zustand store for global state
├── types/        # TypeScript type definitions
└── lib/          # Utility functions
```
