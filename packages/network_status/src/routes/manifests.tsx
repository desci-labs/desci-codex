import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const ManifestsView = lazy(() =>
  import("@/components/ManifestsView").then((module) => ({
    default: module.ManifestsView,
  })),
);

export const Route = createFileRoute("/manifests")({
  component: ManifestsView,
});
