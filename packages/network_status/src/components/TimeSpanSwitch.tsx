import { useUIStore } from "@/store/uiStore";
import { cva } from "class-variance-authority";
import { motion } from "motion/react";

const timespanButtonVariants = cva(
  "px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap",
  {
    variants: {
      state: {
        active: "text-white cursor-default shadow-sm",
        inactive:
          "text-muted-foreground hover:text-foreground cursor-pointer hover:bg-muted",
      },
    },
  },
);

export function TimeSpanSwitch() {
  const { timespan, setTimespan } = useUIStore();

  const timespanOptions = [
    { value: "1week" as const, label: "1 Week" },
    { value: "1month" as const, label: "1 Month" },
  ];

  return (
    <div className="relative flex rounded-lg border p-1 bg-muted/50 min-w-fit whitespace-nowrap">
      {timespanOptions.map((option) => (
        <motion.button
          key={option.value}
          onClick={() => setTimespan(option.value)}
          className={timespanButtonVariants({
            state: timespan === option.value ? "active" : "inactive",
          })}
          style={{ position: "relative", flex: 1 }}
        >
          {timespan === option.value && (
            <motion.div
              layoutId="activeTimespanBackground"
              className="absolute inset-0 rounded-md bg-primary"
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
