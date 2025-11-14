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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Network Overview</h2>
        <Badge variant="success" className="px-3 py-1">
          <span className="mr-2">●</span>
          Network Online
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.value.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                {stat.trend && (
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-500">{stat.trend}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Node Activity (7 days)</CardTitle>
            <CardDescription>Number of nodes active each day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats?.nodesOverTime || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), "MMM d")}
                  className="fill-muted-foreground"
                />
                <YAxis className="fill-muted-foreground" />
                <Tooltip
                  content={(props) => (
                    <ChartTooltip
                      {...props}
                      labelFormatter={(value) => format(new Date(value), "PPP")}
                      pluralizeKeys={{ count: "node" }}
                    />
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                  activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Discovery (7 days)</CardTitle>
            <CardDescription>
              New events and streams discovered each day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats?.discoveryOverTime || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), "MMM d")}
                  className="fill-muted-foreground"
                />
                <YAxis className="fill-muted-foreground" />
                <Tooltip
                  cursor={{ fill: "rgba(255, 255, 255, 0.1)", stroke: "none" }}
                  content={(props) => (
                    <ChartTooltip
                      {...props}
                      labelFormatter={(value) => format(new Date(value), "PPP")}
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Nodes</CardTitle>
          <CardDescription>Latest nodes to join the network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentNodes.map((node) => (
              <div
                key={node.nodeId}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleNodeClick(node.nodeId)}
              >
                <div className="flex items-center space-x-4">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium font-mono">
                        {node.nodeId}
                      </p>
                      <CopyButton text={node.nodeId} />
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        Ceramic peer ID:{" "}
                        <span className="font-mono">{node.ceramicPeerId}</span>
                      </p>
                      <CopyButton text={node.ceramicPeerId} />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    Last seen: {format(new Date(node.lastSeenAt), "pp")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
