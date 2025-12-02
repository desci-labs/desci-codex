import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface CountBadgeProps {
  count: number | undefined;
  label?: string;
  icon?: LucideIcon;
}

export function CountBadge({
  count,
  label = "Total",
  icon: Icon,
}: CountBadgeProps) {
  return (
    <Badge variant="outline">
      {Icon && <Icon className="h-3 w-3 mr-1" />}
      {count?.toLocaleString() || 0} {label}
    </Badge>
  );
}
