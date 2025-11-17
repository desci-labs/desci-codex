import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { format } from "date-fns";
import { Activity, Users, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useStreamEvents } from "@/hooks/useMetrics";

interface StreamCardProps {
  stream: {
    streamId: string;
    streamCid: string;
    firstSeenAt: string;
    eventCount: number;
    nodeCount: number;
  };
}

export function StreamCard({ stream }: StreamCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: streamEvents, isLoading: eventsLoading } = useStreamEvents(
    isExpanded ? stream.streamId : null,
  );

  return (
    <motion.div
      className="border rounded-lg"
      layout
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div
        className="flex items-center justify-between p-3 hover:bg-accent cursor-pointer transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
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
              Stream CID: <span className="font-mono">{stream.streamCid}</span>
            </p>
            <CopyButton text={stream.streamCid} />
          </div>
          <p className="text-xs text-muted-foreground">
            First seen: {format(new Date(stream.firstSeenAt), "PPp")}
          </p>
        </div>
        <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
          <Badge variant="secondary" className="flex items-center">
            <Activity className="h-3 w-3 mr-1" />
            {`${stream.eventCount} ${stream.eventCount === 1 ? "event" : "events"}`}
          </Badge>
          <Badge variant="secondary" className="flex items-center">
            <Users className="h-3 w-3 mr-1" />
            {`${stream.nodeCount} ${stream.nodeCount === 1 ? "node" : "nodes"}`}
          </Badge>
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="border-t bg-muted/50"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="p-3">
              <h4 className="text-sm font-medium mb-2">
                Events ({stream.eventCount})
              </h4>
              {eventsLoading ? (
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {[...Array(Math.min(stream.eventCount, 3))].map((_, i) => (
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
                </motion.div>
              ) : streamEvents && streamEvents.length > 0 ? (
                <motion.div
                  className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                >
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
                            <span className="font-mono">{event.eventCid}</span>
                          </p>
                          <CopyButton text={event.eventCid} />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                        {format(new Date(event.firstSeenAt), "pp")}
                      </p>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.p
                  className="text-xs text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  No events found
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
