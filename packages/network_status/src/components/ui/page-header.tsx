import { Badge } from "@/components/ui/badge";
import { PageDescription } from "@/components/ui/page-description";
import { FetchIndicator } from "@/components/animations/FetchIndicator";
import { motion } from "motion/react";

interface PageHeaderProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  isFetching?: boolean;
  showNetworkStatus?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  description,
  children,
  isFetching = false,
  showNetworkStatus = false,
  className,
}: PageHeaderProps) {
  return (
    <motion.div
      className={`flex items-center justify-between ${className || ""}`}
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {title}
          </h2>
          <FetchIndicator isVisible={isFetching} />
        </div>
        <PageDescription>{description}</PageDescription>
      </div>

      <div className="flex items-center gap-4">
        {children}
        {showNetworkStatus && (
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
        )}
      </div>
    </motion.div>
  );
}
