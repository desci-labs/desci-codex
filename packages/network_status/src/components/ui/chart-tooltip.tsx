import type { TooltipContentProps } from "recharts";
import type {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";

export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
}: TooltipContentProps<ValueType, NameType>) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md">
        <div className="text-sm font-medium">
          {labelFormatter && label ? labelFormatter(label, payload) : label}
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
