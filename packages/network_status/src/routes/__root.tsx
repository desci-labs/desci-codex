import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { RouteLoader } from "@/components/RouteLoader";
import { lazy, Suspense } from "react";

// Lazy load devtools only in development
const TanStackRouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-router-devtools").then((module) => ({
        default: module.TanStackRouterDevtools,
      })),
    )
  : () => null;

interface RouteContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouteContext>()({
  component: () => (
    <>
      <MainLayout>
        <Suspense fallback={<RouteLoader />}>
          <Outlet />
        </Suspense>
      </MainLayout>
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <TanStackRouterDevtools />
        </Suspense>
      )}
    </>
  ),
});
