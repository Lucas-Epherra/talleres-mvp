import Link from "next/link";
import { formatWorkOrderStatus } from "../../../lib/format";
import type { WorkOrder } from "../types";

type WorkOrderCardProps = {
  workOrder: WorkOrder;
};

/**
 * Displays a compact work order summary for large work order lists.
 *
 * Full operational, financial and historical details are available from the
 * order detail page, so this card only exposes customer, vehicle and order
 * identification data.
 */
export function WorkOrderCard({ workOrder }: WorkOrderCardProps) {
  const { vehicle, status } = workOrder;
  const customer = vehicle.customer;

  return (
    <article className="rounded-[1.35rem] border border-border bg-surface/80 p-5 shadow-[var(--shadow-industrial)]-1 ring-white/[0.03] transition hover:border-primary/40 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="grid gap-3 md:grid-cols-2">
            <SummaryContextBox
              label="Cliente"
              title={customer.fullName}
              description={customer.phone ?? "Sin teléfono"}
            />

            <SummaryContextBox
              label="Vehículo"
              title={`${vehicle.brand} ${vehicle.model}`}
              description={vehicle.licensePlate}
            />
          </div>

          <header className="mt-5 border-t border-border pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                  Orden #{workOrder.orderNumber}
                </p>

                <h2 className="mt-2 wrap-anywhere font-display text-xl font-black uppercase tracking-[0.04em] text-white">
                  {workOrder.reportedIssue}
                </h2>
              </div>

              <span
                className={`inline-flex w-fit shrink-0 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${getStatusBadgeClass(
                  status,
                )}`}
              >
                {formatWorkOrderStatus(status)}
              </span>
            </div>
          </header>
        </div>

        <aside className="w-full shrink-0 lg:w-48">
          <div className="flex h-full flex-col gap-3 lg:border-l lg:border-border lg:pl-5">
            <Link
              href={`/work-orders/${workOrder.id}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-[0_14px_35px_rgba(214,40,40,0.22)] transition hover:bg-primary-hover"
            >
              Ver orden
            </Link>

            <Link
              href={`/work-orders/${workOrder.id}/edit`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated"
            >
              Editar orden
            </Link>

            <Link
              href={`/vehicles/${vehicle.id}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated"
            >
              Ver ficha
            </Link>

            <Link
              href={`/customers/${customer.id}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated"
            >
              Ver cliente
            </Link>
          </div>
        </aside>
      </div>
    </article>
  );
}

type SummaryContextBoxProps = {
  label: string;
  title: string;
  description: string;
};

/**
 * Compact context block for the customer and vehicle linked to a work order.
 */
function SummaryContextBox({
  label,
  title,
  description,
}: SummaryContextBoxProps) {
  return (
    <div className="rounded-xl border border-border bg-background/55 p-4 ring-1 ring-white/[0.03]">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
        {label}
      </p>

      <p className="mt-2 wrap-anywhere text-sm font-bold text-white">
        {title}
      </p>

      <p className="mt-1 wrap-anywhere text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/**
 * Maps work order statuses to the industrial product badge system.
 */
function getStatusBadgeClass(status: WorkOrder["status"]): string {
  const statusClassMap: Record<WorkOrder["status"], string> = {
    PENDING: "border-border-strong bg-surface-muted text-muted-foreground",
    IN_PROGRESS: "border-primary/45 bg-primary/10 text-white",
    READY: "border-warning/45 bg-warning/10 text-warning",
    DELIVERED: "border-success/35 bg-success/10 text-success",
  };

  return statusClassMap[status];
}