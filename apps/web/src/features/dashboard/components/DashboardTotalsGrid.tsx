import type { DashboardSummary } from "../types";
import { DashboardHeader } from "./DashboardHeader";

type DashboardTotalsGridProps = {
  summary: DashboardSummary;
};

/**
 * Compatibility wrapper. Totals are now rendered inside the dashboard hero.
 */
export function DashboardTotalsGrid({ summary }: DashboardTotalsGridProps) {
  return <DashboardHeader summary={summary} />;
}
