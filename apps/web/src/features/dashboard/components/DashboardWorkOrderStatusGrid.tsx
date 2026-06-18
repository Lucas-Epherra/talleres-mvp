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
    <section aria-labelledby="work-orders-heading" className="space-y-4">
      <DashboardSectionHeading
        headingId="work-orders-heading"
        eyebrow="Flujo de trabajo"
        title="Estado de órdenes"
        description="Distribución actual de órdenes según avance operativo."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
      </div>
    </section>
  );
}