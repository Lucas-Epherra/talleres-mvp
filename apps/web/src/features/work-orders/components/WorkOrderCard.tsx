import Link from "next/link";
import type { WorkOrder } from "../types";
import { WorkOrderStatusMenu } from "./WorkOrderStatusMenu";

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
    <article className="rounded-[1.1rem] border border-border bg-surface/80 p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 transition hover:border-primary/40 sm:rounded-[1.35rem] sm:p-6">
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

          <header className="mt-4 border-t border-border pt-4 sm:mt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                  Orden #{workOrder.orderNumber}
                </p>

                <h2 className="mt-2 wrap-anywhere font-display text-lg font-black uppercase tracking-[0.04em] text-white sm:text-xl">
                  {workOrder.reportedIssue}
                </h2>
              </div>

              <div className="shrink-0 sm:text-right">
                <WorkOrderStatusMenu
                  workOrderId={workOrder.id}
                  orderNumber={workOrder.orderNumber}
                  currentStatus={status}
                />
              </div>
            </div>
          </header>
        </div>

        <aside className="w-full shrink-0 lg:w-48">
          <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:h-full lg:flex-col lg:gap-3 lg:border-l lg:border-border lg:pl-5">
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
    <div className="rounded-xl border border-border bg-background/55 p-3 ring-1 ring-white/3 sm:p-4">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
        {label}
      </p>

      <p className="mt-2 wrap-anywhere text-sm font-black text-white sm:text-base">
        {title}
      </p>

      <p className="mt-1 wrap-anywhere text-sm font-bold text-white/85 sm:text-base">
        {description}
      </p>
    </div>
  );
}