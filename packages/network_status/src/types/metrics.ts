export interface Node {
  nodeId: string;
  ceramicPeerId: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface Manifest {
  manifestCid: string;
  firstSeenAt: string;
  nodeCount?: number;
}

export interface Stream {
  streamId: string;
  streamCid: string;
  firstSeenAt: string;
  eventCount?: number;
  nodeCount?: number;
}

export interface Event {
  eventId: string;
  streamId?: string;
  eventCid: string;
  firstSeenAt: string;
}

export interface NetworkStats {
  totalNodes: number;
  activeNodes: number;
  totalManifests: number;
  totalStreams: number;
  totalEvents: number;
  nodesOverTime: Array<{
    date: string;
    count: number;
  }>;
  manifestsOverTime: Array<{
    date: string;
    count: number;
  }>;
}

export interface NodeDetail extends Node {
  manifests: Manifest[];
  streams: Stream[];
  events: Event[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}
