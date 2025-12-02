import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const NodesView = lazy(() =>
  import("@/components/NodesView").then((module) => ({
    default: module.NodesView,
  })),
);

export const Route = createFileRoute("/nodes")({
  component: NodesView,
});
