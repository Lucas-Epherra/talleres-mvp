import type { DashboardSummary } from "../types";
import { DashboardWorkflowPanel } from "./DashboardWorkflowPanel";

type DashboardWorkOrderStatusGridProps = {
  summary: DashboardSummary;
};

/**
 * Compatibility wrapper for the old dashboard status component name.
 */
export function DashboardWorkOrderStatusGrid({
  summary,
}: DashboardWorkOrderStatusGridProps) {
  return <DashboardWorkflowPanel summary={summary} />;
}
