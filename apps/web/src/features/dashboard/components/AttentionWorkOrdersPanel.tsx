import Link from "next/link";
import { EmptyState } from "../../../components/ui/EmptyState";
import type { DashboardWorkOrder } from "../types";
import { DashboardWorkOrderPreviewCard } from "./DashboardWorkOrderPreviewCard";

type AttentionWorkOrdersPanelProps = {
  workOrders: DashboardWorkOrder[];
};

/**
 * Shows active work orders that deserve immediate operational attention.
 */
export function AttentionWorkOrdersPanel({
  workOrders,
}: AttentionWorkOrdersPanelProps) {
  return (
    <section
      aria-labelledby="attention-work-orders-heading"
      className="overflow-hidden rounded-[1.35rem] border border-border bg-surface/85 shadow-(--shadow-industrial) ring-1 ring-white/3"
    >
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Prioridad operativa
          </p>

          <h2
            id="attention-work-orders-heading"
            className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-white"
          >
            Requieren atención
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Órdenes activas que todavía no fueron entregadas.
          </p>
        </div>

        <Link
          href="/work-orders"
          className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated sm:w-auto"
        >
          Ver flujo
        </Link>
      </div>

      {workOrders.length > 0 ? (
        <div className="grid gap-4 p-5 xl:grid-cols-2">
          {workOrders.map((workOrder) => (
            <DashboardWorkOrderPreviewCard
              key={workOrder.id}
              workOrder={workOrder}
            />
          ))}
        </div>
      ) : (
        <div className="p-5 sm:p-6">
          <EmptyState
            eyebrow="Sin pendientes"
            title="No hay órdenes activas"
            description="Cuando existan trabajos pendientes, en progreso o listos para entregar, van a aparecer en este bloque."
            actions={[
              {
                label: "Ir a vehículos",
                href: "/vehicles",
                variant: "primary",
              },
              {
                label: "Ver órdenes",
                href: "/work-orders",
                variant: "secondary",
              },
            ]}
          />
        </div>
      )}
    </section>
  );
}