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
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "motion/react";

interface NodeActivityChartProps {
  data: Array<{ date: string; count: number }> | null;
}

export function NodeActivityChart({ data }: NodeActivityChartProps) {
  return (
    <motion.div
      variants={{
        hidden: { x: -50, opacity: 0 },
        visible: { x: 0, opacity: 1 },
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Node Activity (7 days)</CardTitle>
          <CardDescription>Number of nodes active each day</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data || []}>
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
