import { Skeleton } from "@/components/ui/skeleton";

export function RouteLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="space-y-4 text-center">
        <Skeleton className="h-8 w-8 mx-auto rounded-full" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  );
}
