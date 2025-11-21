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

export function ContentDiscoveryChart() {
  const [timespan, setTimespan] = useState<"1week" | "1month">("1week");
  const { data: stats } = useNetworkStats(timespan);

  const data = stats?.discoveryOverTime || [];

  return (
    <motion.div
      variants={{
        hidden: { x: 50, opacity: 0 },
        visible: { x: 0, opacity: 1 },
      }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Content Discovery ({getTimespanLabel(timespan)})
              </CardTitle>
              <CardDescription>
                New events and streams discovered over time
              </CardDescription>
            </div>
            <ChartTimespanSwitch
              timespan={timespan}
              onTimespanChange={setTimespan}
              layoutId="contentDiscoveryTimespanBackground"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data || []} key={`content-discovery-${timespan}`}>
              <XAxis
                dataKey="date"
                type="category"
                tickFormatter={(value) => format(new Date(value), "MMM d")}
                className="fill-muted-foreground text-xs"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                scale="sqrt"
                domain={[0, (dataMax) => Math.max(100, dataMax * 1.15)]}
                allowDecimals={false}
                className="fill-muted-foreground text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value < 1000) return value.toString();
                  return `${(value / 1000).toFixed(0)}K`;
                }}
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
                animationBegin={0}
                animationDuration={600}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="events"
                fill="hsl(217, 70%, 70%)"
                radius={[2, 2, 0, 0]}
                name="Events"
                animationBegin={100}
                animationDuration={600}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
