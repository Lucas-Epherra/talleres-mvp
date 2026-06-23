import type { DashboardSummary } from "../types";
import { DashboardMetricCard } from "./DashboardMetricCard";
import { DashboardSectionHeading } from "./DashboardSectionHeading";

type DashboardWorkOrderStatusGridProps = {
  summary: DashboardSummary;
};

/**
 * Shows the current work order distribution by operational status.
 */
export function DashboardWorkOrderStatusGrid({
  summary,
}: DashboardWorkOrderStatusGridProps) {
  return (
    <section
      aria-labelledby="work-orders-heading"
      className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <DashboardSectionHeading
          headingId="work-orders-heading"
          eyebrow="Flujo de trabajo"
          title="Estado de órdenes"
          description="Distribución actual de órdenes según avance operativo."
        />

        <p className="w-fit rounded-full border border-border-strong bg-surface-muted px-3 py-1.5 text-[0.66rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
          Workflow
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <DashboardMetricCard
          label="Activas"
          value={summary.workOrders.active}
          description="Pendientes, en progreso o listas"
          href="/work-orders"
          tone="primary"
        />

        <DashboardMetricCard
          label="Pendientes"
          value={summary.workOrders.pending}
          description="Aún sin iniciar"
          href="/work-orders?status=PENDING"
        />

        <DashboardMetricCard
          label="En progreso"
          value={summary.workOrders.inProgress}
          description="Trabajo en curso"
          href="/work-orders?status=IN_PROGRESS"
          tone="primary"
        />

        <DashboardMetricCard
          label="Listas"
          value={summary.workOrders.ready}
          description="Preparadas para entregar"
          href="/work-orders?status=READY"
          tone="warning"
        />

        <DashboardMetricCard
          label="Entregadas"
          value={summary.workOrders.delivered}
          description="Historial cerrado"
          href="/work-orders?status=DELIVERED"
          tone="success"
        />

        <DashboardMetricCard
          label="Anuladas"
          value={summary.workOrders.cancelled}
          description="Cerradas sin trabajo activo"
          href="/work-orders?status=CANCELLED"
        />
      </div>
    </section>
  );
}
