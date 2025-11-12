import { useQuery } from "@tanstack/react-query";
import { getNetworkStats } from "@/server/stats";
import { getNodes, getNodeDetail } from "@/server/nodes";
import { getManifests } from "@/server/manifests";
import { getStreams, getStreamEvents } from "@/server/streams";
import { useUIStore } from "@/store/uiStore";

export function useNetworkStats() {
  const refreshInterval = useUIStore((state) => state.refreshInterval);
  const environment = useUIStore((state) => state.environment);

  return useQuery({
    queryKey: ["networkStats", environment],
    queryFn: () => getNetworkStats({ data: { environment } }),
    refetchInterval: refreshInterval,
  });
}

export function useNodes() {
  const refreshInterval = useUIStore((state) => state.refreshInterval);
  const environment = useUIStore((state) => state.environment);

  return useQuery({
    queryKey: ["nodes", environment],
    queryFn: () => getNodes({ data: { environment } }),
    refetchInterval: refreshInterval,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
  });
}

export function useNodeDetail(nodeId: string | null) {
  const environment = useUIStore((state) => state.environment);

  return useQuery({
    queryKey: ["node", nodeId, environment],
    queryFn: () =>
      nodeId
        ? getNodeDetail({ data: { nodeId, environment } })
        : Promise.resolve(null),
    enabled: !!nodeId,
  });
}

export function useManifests(page = 1, limit = 25) {
  const refreshInterval = useUIStore((state) => state.refreshInterval);
  const environment = useUIStore((state) => state.environment);

  return useQuery({
    queryKey: ["manifests", page, limit, environment],
    queryFn: () => getManifests({ data: { page, limit, environment } }),
    refetchInterval: refreshInterval,
  });
}

export function useStreams(page = 1, limit = 25) {
  const refreshInterval = useUIStore((state) => state.refreshInterval);
  const environment = useUIStore((state) => state.environment);

  return useQuery({
    queryKey: ["streams", page, limit, environment],
    queryFn: () => getStreams({ data: { page, limit, environment } }),
    refetchInterval: refreshInterval,
  });
}

export function useStreamEvents(streamId: string | null) {
  const environment = useUIStore((state) => state.environment);

  return useQuery({
    queryKey: ["streamEvents", streamId, environment],
    queryFn: () =>
      streamId
        ? getStreamEvents({ data: { streamId, environment } })
        : Promise.resolve([]),
    enabled: !!streamId,
  });
}
