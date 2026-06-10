import Link from "next/link";
import { formatMileage } from "../../../lib/format";
import type { VehicleListItem } from "../types";

type VehicleCardProps = {
  vehicle: VehicleListItem;
};

/**
 * Displays a compact vehicle summary for the vehicles list.
 */
export function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-slate-700 hover:bg-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
              {vehicle.licensePlate}
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
              {vehicle.brand} {vehicle.model}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {vehicle.year ?? "Año sin cargar"} ·{" "}
              {formatMileage(vehicle.mileage)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-sm font-medium text-slate-100">
              {vehicle.customer.fullName}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {vehicle.customer.phone ?? "Sin teléfono"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {vehicle.customer.email ?? "Sin email"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:items-end">
          <span className="inline-flex rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300">
            {vehicle._count.workOrders} órdenes
          </span>

          <Link
            href={`/vehicles/${vehicle.id}`}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-400"
          >
            Abrir ficha
          </Link>
        </div>
      </div>

      {vehicle.notes ? (
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-400">
          {vehicle.notes}
        </p>
      ) : null}
    </article>
  );
}