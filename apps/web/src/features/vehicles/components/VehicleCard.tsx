import Link from "next/link";
import { formatMileage } from "../../../lib/format";
import type { VehicleListItem } from "../types";

type VehicleCardProps = {
  vehicle: VehicleListItem;
};

/**
 * Displays a compact vehicle summary for large vehicle lists.
 *
 * Full vehicle, customer and work order details are available from the vehicle
 * profile, so this card only exposes the most relevant scanning information.
 */
export function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-slate-700 hover:bg-slate-900 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="wrap-break-word text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
            {vehicle.licensePlate}
          </p>

          <h2 className="mt-2 wrap-break-word text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {vehicle.brand} {vehicle.model}
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <VehicleMetaItem
              label="Año"
              value={vehicle.year ? vehicle.year.toString() : "Sin cargar"}
            />
            <VehicleMetaItem
              label="Kilometraje"
              value={formatMileage(vehicle.mileage)}
            />
            <VehicleMetaItem
              label="Órdenes"
              value={`${vehicle._count.workOrders} orden${
                vehicle._count.workOrders === 1 ? "" : "es"
              }`}
            />
          </div>

          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Cliente asociado
            </p>

            <p className="mt-2 wrap-break-word text-sm font-semibold text-slate-100">
              {vehicle.customer.fullName}
            </p>
          </div>
        </div>

        <aside className="w-full shrink-0 lg:w-48">
          <div className="flex flex-col gap-3 lg:border-l lg:border-slate-800 lg:pl-5">
            <Link
              href={`/vehicles/${vehicle.id}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-400"
            >
              Abrir ficha
            </Link>

            <Link
              href={`/customers/${vehicle.customer.id}`}
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

type VehicleMetaItemProps = {
  label: string;
  value: string;
};

/**
 * Compact metadata block for vehicle summary information.
 */
function VehicleMetaItem({ label, value }: VehicleMetaItemProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 wrap-break-word text-sm font-medium text-slate-100">
        {value}
      </p>
    </div>
  );
}