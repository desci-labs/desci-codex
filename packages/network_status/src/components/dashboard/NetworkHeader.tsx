import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";

export function NetworkHeader() {
  return (
    <motion.div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
        Network Overview
      </h2>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Badge variant="success" className="px-3 py-1 w-fit">
          <motion.div
            className="mr-2 w-2 h-2 bg-current rounded-full"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          Network Online
        </Badge>
      </motion.div>
    </motion.div>
  );
}
