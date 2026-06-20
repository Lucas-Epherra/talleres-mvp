import Link from "next/link";
import { EmptyState } from "../../../components/ui/EmptyState";
import { formatDate, formatMoney } from "../utils";
import type { DashboardWorkOrder } from "../types";
import { WorkOrderStatusIndicator } from "./WorkOrderStatusIndicator";

type AttentionWorkOrdersPanelProps = {
  workOrders: DashboardWorkOrder[];
};

const MAX_VISIBLE_ATTENTION_WORK_ORDERS = 3;

/**
 * Shows active work orders that deserve immediate operational attention.
 *
 * This dashboard section behaves like a horizontal alert band instead of a
 * sidebar list, keeping priority work visible without creating a long rail.
 */
export function AttentionWorkOrdersPanel({
  workOrders,
}: AttentionWorkOrdersPanelProps) {
  const visibleWorkOrders = workOrders.slice(
    0,
    MAX_VISIBLE_ATTENTION_WORK_ORDERS,
  );
  const hiddenWorkOrdersCount = Math.max(
    workOrders.length - visibleWorkOrders.length,
    0,
  );

  return (
    <section
      aria-labelledby="attention-work-orders-heading"
      className="overflow-hidden rounded-[1.35rem] border border-primary/25 bg-linear-to-br from-primary/8 via-surface to-surface-elevated shadow-(--shadow-industrial) ring-1 ring-white/3"
    >
      <div className="flex flex-col gap-3 border-b border-primary/15 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <p className="text-[0.66rem] font-bold uppercase tracking-[0.22em] text-primary">
            Prioridad operativa
          </p>

          <h2
            id="attention-work-orders-heading"
            className="mt-1.5 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground"
          >
            Alertas del taller
          </h2>

          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Órdenes activas que conviene revisar antes de continuar el flujo.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="inline-flex h-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 px-3 text-xs font-black uppercase tracking-[0.14em] text-primary">
            {workOrders.length} alerta{workOrders.length === 1 ? "" : "s"}
          </span>

          <Link
            href="/work-orders"
            className="inline-flex h-9 items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-3 text-xs font-bold text-foreground transition hover:border-primary/60 hover:bg-surface"
          >
            Ver flujo
          </Link>
        </div>
      </div>

      {visibleWorkOrders.length > 0 ? (
        <>
          <div className="grid gap-3 p-4 lg:grid-cols-3">
            {visibleWorkOrders.map((workOrder) => (
              <AttentionAlertCard key={workOrder.id} workOrder={workOrder} />
            ))}
          </div>

          {hiddenWorkOrdersCount > 0 ? (
            <div className="border-t border-primary/15 bg-surface-muted/45 px-4 py-3">
              <Link
                href="/work-orders"
                className="flex flex-col gap-1 text-xs font-bold text-muted-foreground transition hover:text-primary sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  {hiddenWorkOrdersCount} orden
                  {hiddenWorkOrdersCount === 1 ? "" : "es"} más requieren
                  atención
                </span>

                <span className="text-primary">Ver todas →</span>
              </Link>
            </div>
          ) : null}
        </>
      ) : (
        <div className="p-4 sm:p-5">
          <EmptyState
            eyebrow="Sin pendientes"
            title="No hay alertas operativas"
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

type AttentionAlertCardProps = {
  workOrder: DashboardWorkOrder;
};

/**
 * Compact horizontal alert card for priority dashboard work orders.
 */
function AttentionAlertCard({ workOrder }: AttentionAlertCardProps) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-primary/25 bg-surface/90 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition hover:border-primary/45 hover:bg-surface">
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1 bg-primary/60"
      />

      <div className="flex items-start justify-between gap-3 pl-1.5">
        <div className="min-w-0">
          <p className="text-[0.66rem] font-black uppercase tracking-[0.16em] text-primary">
            Orden #{workOrder.orderNumber}
          </p>

          <h3 className="mt-1.5 line-clamp-2 wrap-anywhere font-display text-sm font-black uppercase leading-5 tracking-[0.03em] text-foreground">
            {workOrder.reportedIssue}
          </h3>
        </div>

        <WorkOrderStatusIndicator status={workOrder.status} withLabel={false} />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
        <CompactDetail
          label="Vehículo"
          value={`${workOrder.vehicle.licensePlate} · ${workOrder.vehicle.brand} ${workOrder.vehicle.model}`}
        />

        <CompactDetail
          label="Cliente"
          value={workOrder.vehicle.customer.fullName}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
        <SmallMeta label="Ingreso" value={formatDate(workOrder.entryDate)} />
        <SmallMeta
          label="Estimado"
          value={formatMoney(workOrder.estimatedTotal)}
          align="right"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          href={`/work-orders/${workOrder.id}`}
          className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-3 text-xs font-bold text-white shadow-[0_14px_35px_rgba(214,40,40,0.18)] transition hover:bg-primary-hover"
        >
          Ver orden
        </Link>

        <Link
          href={`/vehicles/${workOrder.vehicle.id}`}
          className="inline-flex h-9 items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-3 text-xs font-bold text-foreground transition hover:border-primary/60 hover:bg-surface"
        >
          Ver ficha
        </Link>
      </div>
    </article>
  );
}

type CompactDetailProps = {
  label: string;
  value: string;
};

/**
 * Small label/value block for priority alert cards.
 */
function CompactDetail({ label, value }: CompactDetailProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted/80 px-3 py-2">
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-primary">
        {label}
      </p>

      <p className="mt-1 line-clamp-1 wrap-anywhere text-xs font-bold text-foreground">
        {value}
      </p>
    </div>
  );
}

type SmallMetaProps = {
  label: string;
  value: string;
  align?: "left" | "right";
};

/**
 * Small metadata block for priority alert cards.
 */
function SmallMeta({ label, value, align = "left" }: SmallMetaProps) {
  return (
    <div className={align === "right" ? "min-w-0 text-right" : "min-w-0"}>
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 line-clamp-1 wrap-anywhere text-xs font-black text-foreground">
        {value}
      </p>
    </div>
  );
}
