import { cva } from "class-variance-authority";
import { motion } from "motion/react";

const timespanButtonVariants = cva(
  "px-2 py-1 rounded text-xs font-medium transition-all whitespace-nowrap",
  {
    variants: {
      state: {
        active: "text-primary-foreground cursor-default shadow-sm",
        inactive:
          "text-muted-foreground hover:text-foreground cursor-pointer hover:bg-muted/50",
      },
    },
  },
);

interface ChartTimespanSwitchProps {
  timespan: "1week" | "1month";
  onTimespanChange: (timespan: "1week" | "1month") => void;
  layoutId?: string;
}

export function ChartTimespanSwitch({
  timespan,
  onTimespanChange,
  layoutId = "chartTimespanBackground",
}: ChartTimespanSwitchProps) {
  const timespanOptions = [
    { value: "1week" as const, label: "1W" },
    { value: "1month" as const, label: "1M" },
  ];

  return (
    <div className="relative flex rounded border p-0.5 bg-muted/30 min-w-fit whitespace-nowrap">
      {timespanOptions.map((option) => (
        <motion.button
          key={option.value}
          onClick={() => onTimespanChange(option.value)}
          className={timespanButtonVariants({
            state: timespan === option.value ? "active" : "inactive",
          })}
          style={{ position: "relative", flex: 1 }}
        >
          {timespan === option.value && (
            <motion.div
              layoutId={layoutId}
              className="absolute inset-0 rounded bg-primary"
              initial={false}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            />
          )}
          <span className="relative z-10">{option.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
