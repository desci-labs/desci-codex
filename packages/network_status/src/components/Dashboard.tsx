import { DashboardSkeleton } from "./DashboardSkeleton";
import { motion } from "motion/react";
import { StaggeredList } from "./animations/StaggeredList";
import { useDashboardData } from "@/hooks/useDashboardData";
import { StatCards } from "./dashboard/StatCards";
import { NodeActivityChart } from "./dashboard/NodeActivityChart";
import { ContentDiscoveryChart } from "./dashboard/ContentDiscoveryChart";
import { RecentNodesList } from "./dashboard/RecentNodesList";
import { NetworkHeader } from "./dashboard/NetworkHeader";

export function Dashboard() {
  const { stats, recentNodes, isLoading, handleNodeClick } = useDashboardData();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <NetworkHeader />

      <StaggeredList className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCards stats={stats} />
      </StaggeredList>

      <motion.div
        className="grid gap-4 lg:grid-cols-2"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.2,
              delayChildren: 0.6,
            },
          },
        }}
      >
        <NodeActivityChart data={stats?.nodesOverTime || null} />
        <ContentDiscoveryChart data={stats?.discoveryOverTime || null} />
      </motion.div>

      <RecentNodesList nodes={recentNodes} onNodeClick={handleNodeClick} />
    </motion.div>
  );
}
