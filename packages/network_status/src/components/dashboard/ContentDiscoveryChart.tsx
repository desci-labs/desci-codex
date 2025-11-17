import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartTooltip } from "@/components/ui/chart-tooltip";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "motion/react";

interface ContentDiscoveryChartProps {
  data: Array<{ date: string; streams: number; events: number }> | null;
}

export function ContentDiscoveryChart({ data }: ContentDiscoveryChartProps) {
  return (
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
            <BarChart data={data || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
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
    </motion.div>
  );
}
