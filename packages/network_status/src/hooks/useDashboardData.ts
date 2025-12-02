import { useNetworkStats, useNodes } from "@/hooks/useMetrics";
import { useUIStore } from "@/store/uiStore";
import { useNavigate } from "@tanstack/react-router";

export function useDashboardData() {
  const { data: stats, isLoading: statsLoading } = useNetworkStats();
  const { data: nodes, isLoading: nodesLoading } = useNodes();

  const navigate = useNavigate();
  const { setSelectedNodeId } = useUIStore();

  const isLoading = statsLoading || nodesLoading;

  const recentNodes = nodes?.slice(0, 5) || [];

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    navigate({ to: "/nodes" });
  };

  return {
    stats,
    nodes,
    recentNodes,
    isLoading,
    handleNodeClick,
  };
}
