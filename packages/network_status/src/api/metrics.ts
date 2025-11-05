import type {
  NetworkStats,
  Node,
  Manifest,
  Stream,
  NodeDetail,
  Event,
  PaginatedResponse,
} from "@/types/metrics";

const API_BASE = "/api";

export const metricsApi = {
  async getNetworkStats(): Promise<NetworkStats> {
    const response = await fetch(`${API_BASE}/stats`);
    if (!response.ok) throw new Error("Failed to fetch network stats");
    return response.json();
  },

  async getNodes(): Promise<Node[]> {
    const response = await fetch(`${API_BASE}/nodes`);
    if (!response.ok) throw new Error("Failed to fetch nodes");
    return response.json();
  },

  async getNodeDetail(nodeId: string): Promise<NodeDetail> {
    const response = await fetch(`${API_BASE}/nodes/${nodeId}`);
    if (!response.ok) throw new Error("Failed to fetch node detail");
    return response.json();
  },

  async getManifests(
    page = 1,
    limit = 25,
  ): Promise<PaginatedResponse<Manifest>> {
    const response = await fetch(
      `${API_BASE}/manifests?page=${page}&limit=${limit}`,
    );
    if (!response.ok) throw new Error("Failed to fetch manifests");
    return response.json();
  },

  async getStreams(page = 1, limit = 25): Promise<PaginatedResponse<Stream>> {
    const response = await fetch(
      `${API_BASE}/streams?page=${page}&limit=${limit}`,
    );
    if (!response.ok) throw new Error("Failed to fetch streams");
    return response.json();
  },

  async getStreamEvents(streamId: string): Promise<Event[]> {
    const response = await fetch(`${API_BASE}/streams/${streamId}/events`);
    if (!response.ok) throw new Error("Failed to fetch stream events");
    return response.json();
  },
};
