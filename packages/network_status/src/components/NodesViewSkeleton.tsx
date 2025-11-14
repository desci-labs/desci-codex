import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function NodesViewSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <Skeleton className="h-2 w-2 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-48" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-3 w-64" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-4 w-4" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32">
                <Skeleton className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
