import type { TooltipContentProps } from "recharts";
import type {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";

interface ChartTooltipProps extends TooltipContentProps<ValueType, NameType> {
  pluralizeKeys?: Record<string, string>;
}

export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  pluralizeKeys = {},
}: ChartTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md">
        <div className="text-sm font-medium">
          {labelFormatter && label ? labelFormatter(label, payload) : label}
        </div>
        {payload.map((entry, index) => {
          const value = entry.value as number;
          const dataKey = entry.dataKey as string;

          let displayText: string;
          if (pluralizeKeys[dataKey]) {
            const baseWord = pluralizeKeys[dataKey];
            const pluralizedWord = value === 1 ? baseWord : `${baseWord}s`;
            displayText = `${value} ${pluralizedWord}`;
          } else if (entry.name) {
            displayText = `${entry.name}: ${value}`;
          } else {
            displayText = String(value);
          }

          return (
            <div
              key={index}
              className="flex items-center gap-1 text-sm text-muted-foreground"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {displayText}
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}
