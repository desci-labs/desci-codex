import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaginationInfo } from "@/types/metrics";

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showLimitSelector?: boolean;
}

export function Pagination({
  pagination,
  onPageChange,
  onLimitChange,
  showLimitSelector = true,
}: PaginationProps) {
  const { page, limit, total, totalPages, hasNext, hasPrev } = pagination;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) {
        pages.push("ellipsis");
      }

      // Show pages around current page
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push("ellipsis");
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const limitOptions = [10, 25, 50, 100];

  return (
    <div className="flex items-center justify-between space-x-6 lg:space-x-8">
      <div className="flex items-center space-x-2">
        <p className="text-sm text-muted-foreground">
          Showing {Math.min((page - 1) * limit + 1, total)} to{" "}
          {Math.min(page * limit, total)} of {total.toLocaleString()} results
        </p>

        {showLimitSelector && onLimitChange && (
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">Rows per page:</p>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="h-8 w-16 rounded border border-input bg-background px-2 text-sm"
            >
              {limitOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md border border-input",
            hasPrev
              ? "hover:bg-accent hover:text-accent-foreground"
              : "cursor-not-allowed opacity-50",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-1">
          {getPageNumbers().map((pageNum, index) =>
            pageNum === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="flex h-8 w-8 items-center justify-center"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            ) : (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md border text-sm",
                  pageNum === page
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {pageNum}
              </button>
            ),
          )}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md border border-input",
            hasNext
              ? "hover:bg-accent hover:text-accent-foreground"
              : "cursor-not-allowed opacity-50",
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
