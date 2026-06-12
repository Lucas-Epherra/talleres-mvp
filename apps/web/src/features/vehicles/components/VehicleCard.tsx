import Link from "next/link";
import { formatMileage } from "../../../lib/format";
import type { VehicleListItem } from "../types";

type VehicleCardProps = {
  vehicle: VehicleListItem;
};

/**
 * Displays a compact vehicle summary for the vehicles list.
 *
 * The card groups vehicle metadata and customer information into clear visual
 * sections so the ficha can be scanned quickly before opening the full profile.
 */
export function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-slate-700 hover:bg-slate-900 sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <header className="border-b border-slate-800 pb-4">
            <p className="wrap-break-word text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
              {vehicle.licensePlate}
            </p>

            <h2 className="mt-2 wrap-break-word text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {vehicle.brand} {vehicle.model}
            </h2>
          </header>

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

          <section
            aria-labelledby={`vehicle-customer-${vehicle.id}`}
            className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h3
                id={`vehicle-customer-${vehicle.id}`}
                className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
              >
                Cliente asociado
              </h3>

              <Link
                href={`/customers/${vehicle.customer.id}`}
                className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300 transition hover:text-orange-200"
              >
                Ver cliente
              </Link>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <CustomerMetaItem
                label="Nombre"
                value={vehicle.customer.fullName}
              />
              <CustomerMetaItem
                label="Teléfono"
                value={vehicle.customer.phone ?? "Sin teléfono"}
              />
              <CustomerMetaItem
                label="Email"
                value={vehicle.customer.email ?? "Sin email"}
              />
            </div>
          </section>

          {/* {vehicle.notes ? (
            <section
              aria-labelledby={`vehicle-notes-${vehicle.id}`}
              className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-4"
            >
              <h3
                id={`vehicle-notes-${vehicle.id}`}
                className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
              >
                Notas del vehículo
              </h3>

              <p className="mt-3 wrap-break-word text-sm leading-6 text-slate-300">
                {vehicle.notes}
              </p>
            </section>
          ) : null} */} {/* //notas anuladas */}
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
 * Compact metadata block for vehicle information.
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

type CustomerMetaItemProps = {
  label: string;
  value: string;
};

/**
 * Compact metadata block for the customer associated with a vehicle.
 */
function CustomerMetaItem({ label, value }: CustomerMetaItemProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 wrap-break-word text-sm font-medium text-slate-100">
        {value}
      </p>
    </div>
  );
}