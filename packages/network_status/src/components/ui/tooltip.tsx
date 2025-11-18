import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  title: string;
  description: string;
  note?: string;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({
  children,
  title,
  description,
  note,
  side = "top",
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  const getTooltipClasses = () => {
    const baseClasses =
      "absolute z-50 px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-lg border border-gray-700 min-w-[200px] max-w-[280px] pointer-events-none transition-opacity duration-200";

    const sideClasses = {
      top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
      bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
      left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
      right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
    };

    return cn(
      baseClasses,
      sideClasses[side],
      isVisible ? "opacity-100" : "opacity-0",
      className,
    );
  };

  const getArrowClasses = () => {
    const baseClasses = "absolute w-0 h-0";

    const arrowClasses = {
      top: "top-full left-1/2 transform -translate-x-1/2 border-l-2 border-r-2 border-t-4 border-transparent border-t-gray-900",
      bottom:
        "bottom-full left-1/2 transform -translate-x-1/2 border-l-2 border-r-2 border-b-4 border-transparent border-b-gray-900",
      left: "left-full top-1/2 transform -translate-y-1/2 border-t-2 border-b-2 border-l-4 border-transparent border-l-gray-900",
      right:
        "right-full top-1/2 transform -translate-y-1/2 border-t-2 border-b-2 border-r-4 border-transparent border-r-gray-900",
    };

    return cn(baseClasses, arrowClasses[side]);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <div className={getTooltipClasses()}>
        <div>
          <div className="font-semibold mb-1">{title}</div>
          <div>{description}</div>
          {note && <div className="mt-1 text-gray-300">{note}</div>}
        </div>
        <div className={getArrowClasses()} />
      </div>
    </div>
  );
}
