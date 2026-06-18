import Link from "next/link";
import {
  formatDate,
  formatMoney,
} from "../../../features/dashboard/utils";
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
    <article className="rounded-2xl border border-border bg-background/55 p-5 ring-1 ring-white/3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-primary">
            Orden #{workOrder.orderNumber}
          </p>

          <h3 className="mt-2 wrap-anywhere font-display text-base font-black uppercase leading-6 tracking-[0.04em] text-white">
            {workOrder.reportedIssue}
          </h3>
        </div>

        <WorkOrderStatusIndicator status={workOrder.status} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
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

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/work-orders/${workOrder.id}`}
          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-[0_14px_35px_rgba(214,40,40,0.22)] transition hover:bg-primary-hover sm:w-auto"
        >
          Ver orden
        </Link>

        <Link
          href={`/vehicles/${workOrder.vehicle.id}`}
          className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated sm:w-auto"
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
    <div className="rounded-xl border border-border bg-surface/70 p-3 ring-1 ring-white/3">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-primary">
        {label}
      </p>

      <p className="mt-2 wrap-anywhere text-sm font-bold text-white">
        {value}
      </p>
    </div>
  );
}