import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import {
  Activity,
  Database,
  FileCode,
  Network,
  TrendingUp,
  LucideIcon,
  CircleQuestionMark,
} from "lucide-react";
import { StaggeredItem } from "../animations/StaggeredList";

interface StatCard {
  title: string;
  value: number;
  icon: LucideIcon;
  description: string;
  tooltip: {
    title: string;
    description: string;
    note?: string;
  };
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
      title: "Nodes",
      value: stats?.totalNodes || 0,
      icon: Network,
      description: `${stats?.activeNodes || 0} active`,
      tooltip: {
        title: "Nodes",
        description:
          "Total number of P2P nodes that have participated in the network.",
        note: "Active nodes are those seen within the last hour.",
      },
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
      description: "unique manifests",
      tooltip: {
        title: "Data manifests",
        description:
          "Schema encoding the files and metadata of a research publication.",
        note: "Contains content-addressed references to arbitrary file structures on IPFS.",
      },
    },
    {
      title: "Streams",
      value: stats?.totalStreams || 0,
      icon: FileCode,
      description: "known streams",
      tooltip: {
        title: "Streams",
        description: "Unique research publications.",
        note: "A stream is an unique chain of events, encoding the history of a publication.",
      },
    },
    {
      title: "Events",
      value: stats?.totalEvents || 0,
      icon: Activity,
      description: "known events",
      tooltip: {
        title: "Events",
        description: "Individual versions of research publications.",
        note: "The building block of streams, enabling each intermediate state to be resolved.",
      },
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
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </h3>
                  <Tooltip
                    title={stat.tooltip.title}
                    description={stat.tooltip.description}
                    note={stat.tooltip.note}
                    side="top"
                  >
                    <CircleQuestionMark className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </Tooltip>
                </div>
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
