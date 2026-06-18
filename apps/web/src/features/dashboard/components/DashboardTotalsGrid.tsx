import type { DashboardSummary } from "../types";
import { DashboardMetricCard } from "./DashboardMetricCard";
import { DashboardSectionHeading } from "./DashboardSectionHeading";

type DashboardTotalsGridProps = {
  summary: DashboardSummary;
};

/**
 * Shows the global operational totals for the authenticated workshop.
 */
export function DashboardTotalsGrid({ summary }: DashboardTotalsGridProps) {
  return (
    <section aria-labelledby="totals-heading" className="space-y-4">
      <DashboardSectionHeading
        headingId="totals-heading"
        eyebrow="Base operativa"
        title="Totales generales"
        description="Estado global del taller y volumen actual de registros."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          label="Clientes"
          value={summary.totals.customers}
          description="Clientes registrados"
          href="/customers"
        />
        <DashboardMetricCard
          label="Vehículos"
          value={summary.totals.vehicles}
          description="Vehículos asociados"
          href="/vehicles"
        />
        <DashboardMetricCard
          label="Órdenes"
          value={summary.totals.workOrders}
          description="Órdenes históricas"
          href="/work-orders"
        />
        <DashboardMetricCard
          label="En taller"
          value={summary.totals.vehiclesInWorkshop}
          description="Vehículos con trabajo activo"
          href="/work-orders"
          tone="primary"
        />
      </div>
    </section>
  );
}