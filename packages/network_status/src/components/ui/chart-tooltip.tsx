import type { TooltipProps } from "recharts";
import type {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";

interface ChartTooltipProps extends TooltipProps<ValueType, NameType> {
  labelFormatter?: (value: string | number) => string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
}: ChartTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md">
        <div className="text-sm font-medium">
          {labelFormatter && label ? labelFormatter(label) : label}
        </div>
        {payload.map((entry, index) => (
          <div key={index} className="text-sm text-muted-foreground">
            <span style={{ color: entry.color }}>●</span> {entry.value}
          </div>
        ))}
      </div>
    );
  }

  return null;
}
