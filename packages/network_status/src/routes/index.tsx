import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const Dashboard = lazy(() =>
  import("@/components/Dashboard").then((module) => ({
    default: module.Dashboard,
  })),
);

export const Route = createFileRoute("/")({
  component: Dashboard,
});
