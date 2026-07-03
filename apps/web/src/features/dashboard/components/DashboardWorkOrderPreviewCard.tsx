import { Eye } from "lucide-react";
import Link from "next/link";
import { formatDate, formatMoney } from "../utils";
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
    <article className="rounded-2xl border border-border bg-surface-muted/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-primary">
            Orden #{workOrder.orderNumber}
          </p>

          <h3 className="mt-1.5 line-clamp-2 wrap-anywhere font-display text-sm font-black uppercase leading-5 tracking-[0.04em] text-foreground">
            {workOrder.reportedIssue}
          </h3>
        </div>

        <WorkOrderStatusIndicator status={workOrder.status} withLabel={false} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <SmallDetail
          label="Vehículo"
          value={`${workOrder.vehicle.licensePlate} · ${workOrder.vehicle.brand} ${workOrder.vehicle.model}`}
        />
        <SmallDetail label="Cliente" value={workOrder.vehicle.customer.fullName} />
        <SmallDetail label="Ingreso" value={formatDate(workOrder.entryDate)} />
        <SmallDetail
          label="Total"
          value={formatMoney(workOrder.finalTotal ?? workOrder.estimatedTotal)}
        />
      </div>

      <Link
        href={`/work-orders/${workOrder.id}`}
        className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-white transition hover:bg-primary-hover"
      >
        <Eye className="size-3.5 shrink-0" aria-hidden="true" />
        Ver orden
      </Link>
    </article>
  );
}

function SmallDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white/75 p-2.5">
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-primary">
        {label}
      </p>

      <p className="mt-1 line-clamp-1 wrap-anywhere text-xs font-bold text-foreground">
        {value}
      </p>
    </div>
  );
}
