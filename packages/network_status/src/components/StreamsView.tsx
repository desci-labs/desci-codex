import { useStreams, useStreamEvents } from "@/hooks/useMetrics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useState } from "react";
import {
  FileCode,
  Activity,
  Users,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { StreamsViewSkeleton } from "./StreamsViewSkeleton";

export function StreamsView() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const { data: streamsResponse, isLoading } = useStreams(page, limit);
  const [expandedStreamId, setExpandedStreamId] = useState<string | null>(null);
  const { data: streamEvents, isLoading: eventsLoading } =
    useStreamEvents(expandedStreamId);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setExpandedStreamId(null); // Close any expanded stream when changing pages
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
    setExpandedStreamId(null); // Close any expanded stream
  };

  if (isLoading) {
    return <StreamsViewSkeleton />;
  }

  const streams = streamsResponse?.data || [];
  const pagination = streamsResponse?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Streams</h2>
        <Badge variant="outline">
          <FileCode className="h-3 w-3 mr-1" />
          {pagination?.total.toLocaleString() || 0} Total
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Streams</CardTitle>
          <CardDescription>Data streams in the network</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {streams.map((stream) => {
              const isExpanded = expandedStreamId === stream.streamId;
              return (
                <div key={stream.streamId} className="border rounded-lg">
                  <div
                    className="flex items-center justify-between p-3 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() =>
                      setExpandedStreamId(isExpanded ? null : stream.streamId)
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium font-mono break-all">
                          {stream.streamId}
                        </p>
                        <CopyButton text={stream.streamId} />
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs text-muted-foreground">
                          Stream CID:{" "}
                          <span className="font-mono">{stream.streamCid}</span>
                        </p>
                        <CopyButton text={stream.streamCid} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        First seen:{" "}
                        {format(new Date(stream.firstSeenAt), "PPp")}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                      <Badge variant="secondary" className="flex items-center">
                        <Activity className="h-3 w-3 mr-1" />
                        {stream.eventCount} events
                      </Badge>
                      <Badge variant="secondary" className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {stream.nodeCount} nodes
                      </Badge>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t bg-muted/50 p-3">
                      <h4 className="text-sm font-medium mb-2">
                        Events ({stream.eventCount})
                      </h4>
                      {eventsLoading ? (
                        <div className="space-y-2">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-2 bg-background rounded"
                            >
                              <div className="flex-1 min-w-0">
                                <Skeleton className="h-3 w-48 mb-1" />
                                <Skeleton className="h-3 w-64" />
                              </div>
                              <Skeleton className="h-3 w-20 ml-2 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      ) : streamEvents && streamEvents.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {streamEvents.map((event) => (
                            <div
                              key={event.eventId}
                              className="flex items-center justify-between p-2 bg-background rounded"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-xs font-mono break-all">
                                    {event.eventId}
                                  </p>
                                  <CopyButton text={event.eventId} />
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-muted-foreground">
                                    Event CID:{" "}
                                    <span className="font-mono">
                                      {event.eventCid}
                                    </span>
                                  </p>
                                  <CopyButton text={event.eventCid} />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                                {format(new Date(event.firstSeenAt), "pp")}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No events found
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {pagination && (
            <div className="pt-4 border-t">
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
