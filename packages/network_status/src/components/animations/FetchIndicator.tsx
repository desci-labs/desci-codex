import { motion } from "motion/react";

interface FetchIndicatorProps {
  isVisible: boolean;
  className?: string;
}

export function FetchIndicator({
  isVisible,
  className = "h-1 w-1 bg-primary rounded-full",
}: FetchIndicatorProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      className={className}
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );
}
