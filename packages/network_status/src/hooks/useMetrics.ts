import { useQuery } from "@tanstack/react-query";
import { metricsApi } from "@/api/metrics";
import { useUIStore } from "@/store/uiStore";

export function useNetworkStats() {
  const refreshInterval = useUIStore((state) => state.refreshInterval);

  return useQuery({
    queryKey: ["networkStats"],
    queryFn: metricsApi.getNetworkStats,
    refetchInterval: refreshInterval,
  });
}

export function useNodes() {
  const refreshInterval = useUIStore((state) => state.refreshInterval);

  return useQuery({
    queryKey: ["nodes"],
    queryFn: metricsApi.getNodes,
    refetchInterval: refreshInterval,
  });
}

export function useNodeDetail(nodeId: string | null) {
  return useQuery({
    queryKey: ["node", nodeId],
    queryFn: () =>
      nodeId ? metricsApi.getNodeDetail(nodeId) : Promise.resolve(null),
    enabled: !!nodeId,
  });
}

export function useManifests(page = 1, limit = 25) {
  const refreshInterval = useUIStore((state) => state.refreshInterval);

  return useQuery({
    queryKey: ["manifests", page, limit],
    queryFn: () => metricsApi.getManifests(page, limit),
    refetchInterval: refreshInterval,
  });
}

export function useStreams(page = 1, limit = 25) {
  const refreshInterval = useUIStore((state) => state.refreshInterval);

  return useQuery({
    queryKey: ["streams", page, limit],
    queryFn: () => metricsApi.getStreams(page, limit),
    refetchInterval: refreshInterval,
  });
}

export function useStreamEvents(streamId: string | null) {
  return useQuery({
    queryKey: ["streamEvents", streamId],
    queryFn: () =>
      streamId ? metricsApi.getStreamEvents(streamId) : Promise.resolve([]),
    enabled: !!streamId,
  });
}
