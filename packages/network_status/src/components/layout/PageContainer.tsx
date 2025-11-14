import { motion } from "motion/react";
import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({
  children,
  className = "space-y-6",
}: PageContainerProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
