import Link from "next/link";
import { formatDate, formatMoney } from "../../../features/dashboard/utils";
import type { DashboardWorkOrder } from "../types";
import { WorkOrderStatusIndicator } from "./WorkOrderStatusIndicator";

type DashboardWorkOrderPreviewCardProps = {
  workOrder: DashboardWorkOrder;
};

/**
 * Compact dashboard preview for a work order.
 */
export function DashboardWorkOrderPreviewCard({
  workOrder,
}: DashboardWorkOrderPreviewCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-surface-muted/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-primary">
            Orden #{workOrder.orderNumber}
          </p>

          <h3 className="mt-1.5 line-clamp-2 wrap-anywhere font-display text-sm font-black uppercase leading-5 tracking-[0.04em] text-foreground">
            {workOrder.reportedIssue}
          </h3>
        </div>

        <WorkOrderStatusIndicator status={workOrder.status} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <SmallDetail
          label="Vehículo"
          value={`${workOrder.vehicle.licensePlate} · ${workOrder.vehicle.brand} ${workOrder.vehicle.model}`}
        />
        <SmallDetail
          label="Cliente"
          value={workOrder.vehicle.customer.fullName}
        />
        <SmallDetail label="Ingreso" value={formatDate(workOrder.entryDate)} />
        <SmallDetail
          label="Estimado"
          value={formatMoney(workOrder.estimatedTotal)}
        />
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link
          href={`/work-orders/${workOrder.id}`}
          className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-primary px-4 text-xs font-bold text-white shadow-[0_14px_35px_rgba(214,40,40,0.18)] transition hover:bg-primary-hover sm:w-auto"
        >
          Ver orden
        </Link>

        <Link
          href={`/vehicles/${workOrder.vehicle.id}`}
          className="inline-flex h-9 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-elevated px-4 text-xs font-bold text-foreground transition hover:border-primary/60 hover:bg-surface sm:w-auto"
        >
          Ver ficha
        </Link>
      </div>
    </article>
  );
}

type SmallDetailProps = {
  label: string;
  value: string;
};

/**
 * Compact label/value block for dashboard order cards.
 */
function SmallDetail({ label, value }: SmallDetailProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated/80 p-2.5">
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-primary">
        {label}
      </p>

      <p className="mt-1 line-clamp-1 wrap-anywhere text-xs font-bold text-foreground">
        {value}
      </p>
    </div>
  );
}