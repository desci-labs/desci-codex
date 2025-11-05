import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function StreamsViewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-8 w-24" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="border rounded-lg">
                <div className="flex items-center justify-between p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Skeleton className="h-4 w-64" />
                      <Skeleton className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Skeleton className="h-3 w-96" />
                      <Skeleton className="h-6 w-6" />
                    </div>
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination skeleton */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
