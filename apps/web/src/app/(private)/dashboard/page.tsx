import type { Metadata } from "next";
import { AttentionWorkOrdersPanel } from "../../../features/dashboard/components/AttentionWorkOrdersPanel";
import { DashboardHeader } from "../../../features/dashboard/components/DashboardHeader";
import { DashboardQuickActions } from "../../../features/dashboard/components/DashboardQuickActions";
import { DashboardTotalsGrid } from "../../../features/dashboard/components/DashboardTotalsGrid";
import { DashboardWorkOrderStatusGrid } from "../../../features/dashboard/components/DashboardWorkOrderStatusGrid";
import { LatestWorkOrdersPanel } from "../../../features/dashboard/components/LatestWorkOrdersPanel";
import { getDashboardSummary } from "../../../features/dashboard/dashboard.server";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * Private dashboard page.
 *
 * Shows the authenticated workshop operational summary using server-side data
 * fetching and httpOnly cookie forwarding.
 */
export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <section className="space-y-6 sm:space-y-8">
      <DashboardHeader />
      <DashboardTotalsGrid summary={summary} />
      <DashboardWorkOrderStatusGrid summary={summary} />
      <DashboardQuickActions />
      <AttentionWorkOrdersPanel workOrders={summary.attentionWorkOrders} />
      <LatestWorkOrdersPanel workOrders={summary.latestWorkOrders} />
    </section>
  );
}