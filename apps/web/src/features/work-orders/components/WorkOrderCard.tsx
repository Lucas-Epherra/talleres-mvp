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
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
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

          <header className="mt-5 border-t border-slate-800 pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-orange-300">
                  Orden #{workOrder.orderNumber}
                </p>

                <h2 className="mt-2 wrap-break-word text-xl font-semibold tracking-tight text-white">
                  {workOrder.reportedIssue}
                </h2>
              </div>

              <span className="inline-flex w-fit shrink-0 rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100">
                {formatWorkOrderStatus(status)}
              </span>
            </div>
          </header>
        </div>

        <aside className="w-full shrink-0 lg:w-48">
          <div className="flex h-full flex-col gap-3 lg:border-l lg:border-slate-800 lg:pl-5">
            <Link
              href={`/work-orders/${workOrder.id}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-400"
            >
              Ver orden
            </Link>

            <Link
              href={`/work-orders/${workOrder.id}/edit`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-100 transition hover:border-orange-400 hover:text-orange-300"
            >
              Editar orden
            </Link>

            <Link
              href={`/vehicles/${vehicle.id}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-100 transition hover:border-orange-400 hover:text-orange-300"
            >
              Ver ficha
            </Link>

            <Link
              href={`/customers/${customer.id}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-100 transition hover:border-orange-400 hover:text-orange-300"
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
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 wrap-break-word text-sm font-semibold text-slate-100">
        {title}
      </p>

      <p className="mt-1 wrap-break-word text-sm text-slate-400">
        {description}
      </p>
    </div>
  );
}