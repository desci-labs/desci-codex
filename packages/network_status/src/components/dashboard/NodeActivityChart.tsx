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
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "motion/react";
import { useNetworkStats } from "@/hooks/useMetrics";
import { ChartTimespanSwitch } from "@/components/ChartTimespanSwitch";
import { useState } from "react";

function getTimespanLabel(timespan: string) {
  switch (timespan) {
    case "1week":
      return "7 days";
    case "1month":
      return "30 days";
    default:
      return timespan;
  }
}

export function NodeActivityChart() {
  const [timespan, setTimespan] = useState<"1week" | "1month">("1week");
  const { data: stats } = useNetworkStats(timespan);
  const data = stats?.nodesOverTime || [];

  return (
    <motion.div
      variants={{
        hidden: { x: -50, opacity: 0 },
        visible: { x: 0, opacity: 1 },
      }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Node Activity ({getTimespanLabel(timespan)})
              </CardTitle>
              <CardDescription>
                Number of nodes active over time
              </CardDescription>
            </div>
            <ChartTimespanSwitch
              timespan={timespan}
              onTimespanChange={setTimespan}
              layoutId="nodeActivityTimespanBackground"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data || []} key={`node-activity-${timespan}`}>
              <XAxis
                dataKey="date"
                type="category"
                tickFormatter={(value) => format(new Date(value), "MMM d")}
                className="fill-muted-foreground text-xs"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                className="fill-muted-foreground text-xs"
                tick={{ fontSize: 12 }}
                allowDecimals={false}
                domain={[0, (dataMax) => dataMax * 1.1]}
              />
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
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
