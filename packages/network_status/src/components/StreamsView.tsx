import { useStreams } from "@/hooks/useMetrics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { useState } from "react";
import { FileCode } from "lucide-react";
import { StreamsViewSkeleton } from "./StreamsViewSkeleton";
import { PageContainer } from "./layout/PageContainer";
import { FetchIndicator } from "./animations/FetchIndicator";
import { StreamCard } from "./StreamCard";
import { CountBadge } from "./CountBadge";

export function StreamsView() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const {
    data: streamsResponse,
    isLoading,
    isFetching,
  } = useStreams(page, limit);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  };

  if (isLoading) {
    return (
      <PageContainer>
        <StreamsViewSkeleton />
      </PageContainer>
    );
  }

  const streams = streamsResponse?.data || [];
  const pagination = streamsResponse?.pagination;

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold tracking-tight">Streams</h2>
          <FetchIndicator isVisible={isFetching && !isLoading} />
        </div>
        <CountBadge count={pagination?.total} icon={FileCode} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Streams</CardTitle>
          <CardDescription>Data streams in the network</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {streams.map((stream) => (
              <StreamCard key={stream.streamId} stream={stream} />
            ))}
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
    </PageContainer>
  );
}
