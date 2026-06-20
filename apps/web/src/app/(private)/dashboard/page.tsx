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
 * Shows the authenticated workshop operational cockpit using server-side data
 * fetching and httpOnly cookie forwarding.
 */
export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <section className="space-y-4 sm:space-y-5">
      <DashboardHeader />

      <DashboardTotalsGrid summary={summary} />

      <AttentionWorkOrdersPanel workOrders={summary.attentionWorkOrders} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start 2xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <DashboardWorkOrderStatusGrid summary={summary} />
        </div>

        <aside className="min-w-0">
          <DashboardQuickActions />
        </aside>
      </div>

      <LatestWorkOrdersPanel workOrders={summary.latestWorkOrders} />
    </section>
  );
}
