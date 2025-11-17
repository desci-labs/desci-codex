import { Card } from "@/components/ui/card";
import {
  Activity,
  Database,
  FileCode,
  Network,
  TrendingUp,
  LucideIcon,
} from "lucide-react";
import { StaggeredItem } from "../animations/StaggeredList";

interface StatCard {
  title: string;
  value: number;
  icon: LucideIcon;
  description: string;
  trend?: string | null;
}

interface StatCardsProps {
  stats:
    | {
        totalNodes: number;
        activeNodes: number;
        totalManifests: number;
        totalStreams: number;
        totalEvents: number;
      }
    | null
    | undefined;
}

export function StatCards({ stats }: StatCardsProps) {
  const statCards: StatCard[] = [
    {
      title: "Total Nodes",
      value: stats?.totalNodes || 0,
      icon: Network,
      description: `${stats?.activeNodes || 0} active`,
      trend:
        stats?.activeNodes && stats?.totalNodes
          ? ((stats.activeNodes / stats.totalNodes) * 100).toFixed(1) +
            "% active"
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

  return (
    <>
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <StaggeredItem key={stat.title}>
            <Card className="h-full p-3 sm:p-4">
              <div className="flex flex-row items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </h3>
                <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold">
                {stat.value.toLocaleString()}
              </div>
              <div className="flex items-center justify-between gap-2 mt-2">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {stat.description}
                </p>
                {stat.trend && (
                  <div className="flex items-center">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-500">{stat.trend}</span>
                  </div>
                )}
              </div>
            </Card>
          </StaggeredItem>
        );
      })}
    </>
  );
}
