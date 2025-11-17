import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { format } from "date-fns";
import { motion } from "motion/react";

interface Node {
  nodeId: string;
  ceramicPeerId: string;
  lastSeenAt: string;
}

interface RecentNodesListProps {
  nodes: Node[];
  onNodeClick: (nodeId: string) => void;
}

export function RecentNodesList({ nodes, onNodeClick }: RecentNodesListProps) {
  return (
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
            {nodes.map((node) => (
              <div
                key={node.nodeId}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors gap-3"
                onClick={() => onNodeClick(node.nodeId)}
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
                        <span className="font-mono">{node.ceramicPeerId}</span>
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
  );
}
