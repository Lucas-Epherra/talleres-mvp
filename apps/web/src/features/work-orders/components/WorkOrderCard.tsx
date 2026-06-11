import Link from "next/link";
import {
  formatDate,
  formatMileage,
  formatMoney,
  formatWorkOrderStatus,
} from "../../../lib/format";
import type { WorkOrder } from "../types";

type WorkOrderCardProps = {
  workOrder: WorkOrder;
};

/**
 * Displays a work order summary in the global work orders list.
 */
export function WorkOrderCard({ workOrder }: WorkOrderCardProps) {
  const { vehicle, status } = workOrder;
  const customer = vehicle.customer;

  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-orange-300">
            Orden #{workOrder.orderNumber}
          </p>

          <h2 className="mt-2 wrap-break-word text-lg font-semibold tracking-tight text-white sm:text-xl">
            {workOrder.reportedIssue}
          </h2>

          <p className="mt-3 wrap-break-word text-sm leading-6 text-slate-400">
            {workOrder.diagnosis ?? "Diagnóstico pendiente"}
          </p>
        </div>

        <div className="shrink-0">
          <span className="inline-flex w-fit rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100">
            {formatWorkOrderStatus(status)}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_1fr_1.4fr]">
        <section
          aria-labelledby={`vehicle-${workOrder.id}`}
          className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5"
        >
          <h3
            id={`vehicle-${workOrder.id}`}
            className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
          >
            Vehículo
          </h3>

          <p className="mt-3 wrap-break-word text-lg font-semibold text-white">
            {vehicle.licensePlate}
          </p>

          <p className="mt-1 wrap-break-word text-sm text-slate-400">
            {vehicle.brand} {vehicle.model}
            {vehicle.year ? ` · ${vehicle.year}` : ""}
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Último km: {formatMileage(vehicle.mileage)}
          </p>

          <Link
            href={`/vehicles/${vehicle.id}`}
            className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-100 transition hover:border-orange-400 hover:text-orange-300 sm:w-auto"
          >
            Ver ficha
          </Link>
        </section>

        <section
          aria-labelledby={`customer-${workOrder.id}`}
          className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5"
        >
          <h3
            id={`customer-${workOrder.id}`}
            className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
          >
            Cliente
          </h3>

          <p className="mt-3 wrap-break-word text-sm font-semibold text-white">
            {customer.fullName}
          </p>

          <p className="mt-2 wrap-break-word text-sm text-slate-400">
            {customer.phone ?? "Sin teléfono"}
          </p>

          <p className="mt-1 wrap-break-word text-sm text-slate-400">
            {customer.email ?? "Sin email"}
          </p>
        </section>

        <dl className="grid gap-3 sm:grid-cols-2">
          <Detail label="Ingreso" value={formatDate(workOrder.entryDate)} />
          <Detail label="Entrega" value={formatDate(workOrder.deliveryDate)} />
          <Detail
            label="Km ingreso"
            value={formatMileage(workOrder.entryMileage)}
          />
          <Detail
            label="Estimado"
            value={formatMoney(workOrder.estimatedTotal)}
          />
          <Detail
            label="Mano de obra"
            value={formatMoney(workOrder.laborCost)}
          />
          <Detail
            label="Total final"
            value={formatMoney(workOrder.finalTotal)}
          />
        </dl>
      </div>

      {workOrder.notes ? (
        <p className="mt-5 wrap-break-word rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm leading-6 text-slate-400">
          {workOrder.notes}
        </p>
      ) : null}
    </article>
  );
}

type DetailProps = {
  label: string;
  value: string;
};

/**
 * Compact metadata item used inside the work order card.
 */
function Detail({ label, value }: DetailProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 wrap-break-word text-sm font-semibold text-slate-100">
        {value}
      </dd>
    </div>
  );
}