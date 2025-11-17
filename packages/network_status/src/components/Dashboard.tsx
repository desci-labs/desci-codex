import { useNetworkStats, useNodes } from "@/hooks/useMetrics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { ChartTooltip } from "@/components/ui/chart-tooltip";
import {
  Activity,
  Database,
  FileCode,
  Network,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "@tanstack/react-router";
import { useUIStore } from "@/store/uiStore";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { motion } from "motion/react";
import { StaggeredList, StaggeredItem } from "./animations/StaggeredList";

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useNetworkStats();
  const { data: nodes, isLoading: nodesLoading } = useNodes();

  const navigate = useNavigate();
  const { setSelectedNodeId } = useUIStore();

  if (statsLoading || nodesLoading) {
    return <DashboardSkeleton />;
  }

  const statCards = [
    {
      title: "Total Nodes",
      value: stats?.totalNodes || 0,
      icon: Network,
      description: `${stats?.activeNodes || 0} active`,
      trend: stats?.activeNodes
        ? ((stats.activeNodes / stats.totalNodes) * 100).toFixed(1) + "% active"
        : null,
    },
    {
      title: "Manifests",
      value: stats?.totalManifests || 0,
      icon: Database,
      description: "Unique manifests",
    },
    {
      title: "Streams",
      value: stats?.totalStreams || 0,
      icon: FileCode,
      description: "Active streams",
    },
    {
      title: "Events",
      value: stats?.totalEvents || 0,
      icon: Activity,
      description: "Total events",
    },
  ];

  const recentNodes = nodes?.slice(0, 5) || [];

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    navigate({ to: "/nodes" });
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          Network Overview
        </h2>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Badge variant="success" className="px-3 py-1 w-fit">
            <motion.div
              className="mr-2 w-2 h-2 bg-current rounded-full"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            Network Online
          </Badge>
        </motion.div>
      </motion.div>

      <StaggeredList className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <StaggeredItem key={stat.title}>
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm md:text-base font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
                    {stat.value.toLocaleString()}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {stat.description}
                    </p>
                    {stat.trend && (
                      <div className="flex items-center w-fit">
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                        <span className="text-xs text-green-500">
                          {stat.trend}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </StaggeredItem>
          );
        })}
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
        <motion.div
          variants={{
            hidden: { x: -50, opacity: 0 },
            visible: { x: 0, opacity: 1 },
          }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Node Activity (7 days)</CardTitle>
              <CardDescription>Number of nodes active each day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats?.nodesOverTime || []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), "MMM d")}
                    className="fill-muted-foreground text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    className="fill-muted-foreground text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    content={(props) => (
                      <ChartTooltip
                        {...props}
                        labelFormatter={(value) =>
                          format(new Date(value), "PPP")
                        }
                        pluralizeKeys={{ count: "node" }}
                      />
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={{
            hidden: { x: 50, opacity: 0 },
            visible: { x: 0, opacity: 1 },
          }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Content Discovery (7 days)</CardTitle>
              <CardDescription>
                New events and streams discovered each day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats?.discoveryOverTime || []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), "MMM d")}
                    className="fill-muted-foreground text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    className="fill-muted-foreground text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{
                      fill: "rgba(255, 255, 255, 0.1)",
                      stroke: "none",
                    }}
                    content={(props) => (
                      <ChartTooltip
                        {...props}
                        labelFormatter={(value) =>
                          format(new Date(value), "PPP")
                        }
                        pluralizeKeys={{ streams: "stream", events: "event" }}
                      />
                    )}
                  />
                  <Bar
                    dataKey="streams"
                    fill="hsl(142, 60%, 65%)"
                    radius={[2, 2, 0, 0]}
                    name="Streams"
                  />
                  <Bar
                    dataKey="events"
                    fill="hsl(217, 70%, 70%)"
                    radius={[2, 2, 0, 0]}
                    name="Events"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent Nodes</CardTitle>
            <CardDescription>Latest nodes to join the network</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentNodes.map((node) => (
                <div
                  key={node.nodeId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors gap-3"
                  onClick={() => handleNodeClick(node.nodeId)}
                >
                  <div className="flex items-start space-x-3 min-w-0 flex-1">
                    <div className="h-2 w-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium font-mono break-all">
                          {node.nodeId}
                        </p>
                        <CopyButton
                          text={node.nodeId}
                          className="flex-shrink-0"
                        />
                      </div>
                      <div className="flex items-start gap-2 flex-wrap">
                        <p className="text-xs text-muted-foreground break-all">
                          Ceramic peer ID:{" "}
                          <span className="font-mono">
                            {node.ceramicPeerId}
                          </span>
                        </p>
                        <CopyButton
                          text={node.ceramicPeerId}
                          className="flex-shrink-0"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">
                      Last seen: {format(new Date(node.lastSeenAt), "pp")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
