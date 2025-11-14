/// <reference types="vite/client" />
import type { ReactNode } from "react";
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  useLocation,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { RouteLoader } from "@/components/RouteLoader";
import { lazy, Suspense, useEffect, useState } from "react";
import { motion } from "motion/react";
import appCss from "../index.css?url";
import blackLogoUrl from "@/static/DeSci_Protocol_A_Black_v01.svg?url";
import whiteLogoUrl from "@/static/DeSci_Protocol_A_White_v01.svg?url";

// Lazy load devtools only in development
const TanStackRouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-router-devtools").then((module) => ({
        default: module.TanStackRouterDevtools,
      })),
    )
  : () => null;

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((module) => ({
        default: module.ReactQueryDevtools,
      })),
    )
  : () => null;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10, // 10 seconds
      refetchInterval: 1000 * 30, // 30 seconds
    },
  },
});

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "DeSci Codex Network Status",
      },
      {
        name: "description",
        content: "Real-time network status dashboard for DeSci Codex",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: blackLogoUrl,
        media: "(prefers-color-scheme: light)",
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: whiteLogoUrl,
        media: "(prefers-color-scheme: dark)",
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const [isClient, setIsClient] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <MainLayout>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Suspense fallback={<RouteLoader />}>
              <Outlet />
            </Suspense>
          </motion.div>
        </MainLayout>
        {import.meta.env.DEV && isClient && (
          <>
            <Suspense fallback={null}>
              <TanStackRouterDevtools />
            </Suspense>
            <Suspense fallback={null}>
              <ReactQueryDevtools initialIsOpen={false} />
            </Suspense>
          </>
        )}
      </QueryClientProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
