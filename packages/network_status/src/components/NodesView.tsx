import { useNodes, useNodeDetail } from "@/hooks/useMetrics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { format, formatDistanceToNow } from "date-fns";
import {
  ChevronRight,
  Network,
  Database,
  FileCode,
  Activity,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";
import { NodesViewSkeleton } from "./NodesViewSkeleton";
import { NodesMap } from "./NodesMap";
import { PageContainer } from "./layout/PageContainer";
import { FetchIndicator } from "./animations/FetchIndicator";

export function NodesView() {
  const { data: nodes, isLoading, isFetching } = useNodes();
  const { selectedNodeId, setSelectedNodeId } = useUIStore();
  const { data: nodeDetail } = useNodeDetail(selectedNodeId);

  if (isLoading) {
    return (
      <PageContainer>
        <NodesViewSkeleton />
      </PageContainer>
    );
  }

  const isNodeActive = (lastSeenAt: string) => {
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
    return diffMinutes < 60;
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold tracking-tight">Network Nodes</h2>
          <FetchIndicator isVisible={isFetching && !isLoading} />
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline">
            {nodes?.filter((n) => isNodeActive(n.lastSeenAt)).length || 0}{" "}
            Active
          </Badge>
          <Badge variant="outline">{nodes?.length || 0} Total</Badge>
        </div>
      </div>

      {/* Map Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <CardTitle>Node Locations</CardTitle>
            </div>
            <Badge variant="outline">
              {nodes?.filter((n) => n.location?.country).length || 0} with
              location data
            </Badge>
          </div>
          <CardDescription>
            Geographic distribution of nodes across the network. For preserving
            privacy, the locations are not exact.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NodesMap nodes={nodes || []} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Nodes</CardTitle>
              <CardDescription>Click on a node to view details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                {nodes?.map((node) => {
                  const active = isNodeActive(node.lastSeenAt);
                  return (
                    <div
                      key={node.nodeId}
                      onClick={() => setSelectedNodeId(node.nodeId)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors",
                        selectedNodeId === node.nodeId && "bg-accent",
                      )}
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            active ? "bg-green-500" : "bg-gray-400",
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium font-mono truncate">
                              {node.nodeId}
                            </p>
                            <CopyButton text={node.nodeId} />
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              Ceramic:{" "}
                              <span className="font-mono">
                                {node.ceramicPeerId}
                              </span>
                            </p>
                            <CopyButton text={node.ceramicPeerId} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={active ? "success" : "secondary"}
                          className="text-xs"
                        >
                          {active ? "Active" : "Inactive"}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          {selectedNodeId && nodeDetail ? (
            <Card>
              <CardHeader>
                <CardTitle>Node Details</CardTitle>
                <div className="flex items-center gap-2">
                  <CardDescription className="font-mono text-xs">
                    {selectedNodeId}
                  </CardDescription>
                  <CopyButton text={selectedNodeId} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Ceramic Peer ID
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono break-all">
                      {nodeDetail.ceramicPeerId}
                    </p>
                    <CopyButton text={nodeDetail.ceramicPeerId} />
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    First Seen
                  </p>
                  <p className="text-sm">
                    {format(new Date(nodeDetail.firstSeenAt), "PPp")}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Last Seen
                  </p>
                  <p className="text-sm">
                    {formatDistanceToNow(new Date(nodeDetail.lastSeenAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Manifests</span>
                    </div>
                    <Badge variant="outline">
                      {nodeDetail.manifests?.length || 0}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileCode className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Streams</span>
                    </div>
                    <Badge variant="outline">
                      {nodeDetail.streams?.length || 0}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Events</span>
                    </div>
                    <Badge variant="outline">
                      {nodeDetail.events?.length || 0}
                    </Badge>
                  </div>
                </div>

                {nodeDetail.manifests && nodeDetail.manifests.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Recent Manifests</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                      {nodeDetail.manifests.slice(0, 5).map((manifest) => (
                        <div
                          key={manifest.manifestCid}
                          className="flex items-center gap-2"
                        >
                          <p className="text-xs font-mono text-muted-foreground break-all flex-1">
                            {manifest.manifestCid}
                          </p>
                          <CopyButton text={manifest.manifestCid} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Node Details</CardTitle>
                <CardDescription>Select a node to view details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <Network className="h-8 w-8" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
