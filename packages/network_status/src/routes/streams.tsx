import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const StreamsView = lazy(() =>
  import("@/components/StreamsView").then((module) => ({
    default: module.StreamsView,
  })),
);

export const Route = createFileRoute("/streams")({
  component: StreamsView,
});
