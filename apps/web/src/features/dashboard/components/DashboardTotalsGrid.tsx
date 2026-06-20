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
    <section
      aria-labelledby="totals-heading"
      className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface-elevated via-surface to-surface p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <DashboardSectionHeading
          headingId="totals-heading"
          eyebrow="Base operativa"
          title="Totales generales"
          description="Estado global del taller y volumen actual de registros."
        />

        <p className="w-fit rounded-full border border-border-strong bg-surface-muted px-3 py-1.5 text-[0.66rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
          KPI cards
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
