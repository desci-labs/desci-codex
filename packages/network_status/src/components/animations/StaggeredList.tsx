import { motion } from "motion/react";
import { ReactNode } from "react";

interface StaggeredListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
}

export function StaggeredList({
  children,
  className = "",
  staggerDelay = 0.1,
  initialDelay = 0.2,
}: StaggeredListProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: initialDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
      }}
    >
      {children}
    </motion.div>
  );
}
