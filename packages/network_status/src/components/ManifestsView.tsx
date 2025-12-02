import { useManifests } from "@/hooks/useMetrics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { IPFSButton } from "@/components/ui/ipfs-button";
import { Pagination } from "@/components/ui/pagination";
import { format } from "date-fns";
import { useState } from "react";
import { Database, Users } from "lucide-react";
import { ManifestsViewSkeleton } from "./ManifestsViewSkeleton";
import { PageContainer } from "./layout/PageContainer";
import { CountBadge } from "./CountBadge";
import { PageHeader } from "@/components/ui/page-header";

export function ManifestsView() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const {
    data: manifestsResponse,
    isLoading,
    isFetching,
  } = useManifests(page, limit);

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
        <ManifestsViewSkeleton />
      </PageContainer>
    );
  }

  const manifests = manifestsResponse?.data || [];
  const pagination = manifestsResponse?.pagination;

  return (
    <>
      <PageHeader
        title="Manifests"
        description="Browse all manifests stored on the Codex Network. A manifest encodes the data and metadata of a research publication."
        isFetching={isFetching && !isLoading}
      >
        <CountBadge count={pagination?.total} icon={Database} />
      </PageHeader>

      <PageContainer>
        <Card>
          <CardHeader>
            <CardTitle>All Manifests</CardTitle>
            <CardDescription>
              Content manifests stored in the network. These can be resolved
              over IPFS.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {manifests.map((manifest) => (
                <div
                  key={manifest.manifestCid}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <p className="text-sm font-medium font-mono break-all">
                          {manifest.manifestCid}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <CopyButton text={manifest.manifestCid} />
                          <IPFSButton cid={manifest.manifestCid} />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      First seen:{" "}
                      {format(new Date(manifest.firstSeenAt), "PPp")}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                    <Badge variant="secondary" className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {manifest.nodeCount} nodes
                    </Badge>
                  </div>
                </div>
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
    </>
  );
}
