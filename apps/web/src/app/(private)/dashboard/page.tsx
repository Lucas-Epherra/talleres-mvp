import type { Metadata } from "next";
import { DashboardAlertsPanel } from "../../../features/dashboard/components/DashboardAlertsPanel";
import { DashboardHeader } from "../../../features/dashboard/components/DashboardHeader";
import { DashboardQuickActions } from "../../../features/dashboard/components/DashboardQuickActions";
import { DashboardTodayAgendaPanel } from "../../../features/dashboard/components/DashboardTodayAgendaPanel";
import { DashboardWorkflowPanel } from "../../../features/dashboard/components/DashboardWorkflowPanel";
import { LatestWorkOrdersPanel } from "../../../features/dashboard/components/LatestWorkOrdersPanel";
import { getDashboardSummary } from "../../../features/dashboard/dashboard.server";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * Private dashboard page.
 *
 * Keeps the dashboard focused on the daily workshop routine: what needs
 * attention, what can be done quickly, what is scheduled and how orders move.
 */
export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <section className="space-y-5 sm:space-y-6">
      <DashboardHeader summary={summary} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
        <DashboardAlertsPanel alerts={summary.alerts} />

        <DashboardQuickActions />
      </div>

      <DashboardWorkflowPanel summary={summary} />

      <DashboardTodayAgendaPanel
        todayAppointments={summary.appointments.today}
        upcomingAppointments={summary.appointments.upcoming}
      />

      <LatestWorkOrdersPanel workOrders={summary.recentWorkOrders} />
    </section>
  );
}
