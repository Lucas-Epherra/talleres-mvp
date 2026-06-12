import Link from "next/link";
import type { VehicleListItem } from "../../vehicles/types";
import type { Customer } from "../types";

type CustomerCardProps = {
  customer: Customer;
  vehicles: VehicleListItem[];
};

const MAX_VISIBLE_VEHICLES = 2;

/**
 * Displays a compact customer summary for large customer lists.
 *
 * Full customer contact, vehicle and work order details are available from the
 * customer detail page, so this card only exposes key scanning information and
 * a small fixed-height vehicle preview.
 */
export function CustomerCard({ customer, vehicles }: CustomerCardProps) {
  const visibleVehicles = vehicles.slice(0, MAX_VISIBLE_VEHICLES);
  const hiddenVehiclesCount = Math.max(vehicles.length - MAX_VISIBLE_VEHICLES, 0);

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="min-w-0 flex-1">
          <header className="flex flex-col gap-5 border-b border-slate-800 pb-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
                Cliente
              </p>

              <h2 className="mt-2 wrap-break-word text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {customer.fullName}
              </h2>
            </div>

            <div className="min-w-0 md:max-w-xs md:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Teléfono
              </p>

              <p className="mt-2 wrap-break-word text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {customer.phone ?? "Sin teléfono"}
              </p>
            </div>
          </header>

          <section
            aria-labelledby={`customer-vehicles-preview-${customer.id}`}
            className="mt-4 h-12 overflow-hidden"
          >
            <h3 id={`customer-vehicles-preview-${customer.id}`} className="sr-only">
              Vehículos asociados
            </h3>

            {vehicles.length > 0 ? (
              <div className="flex h-full flex-wrap items-center gap-2 overflow-hidden">
                {visibleVehicles.map((vehicle) => (
                  <Link
                    key={vehicle.id}
                    href={`/vehicles/${vehicle.id}`}
                    className="inline-flex max-w-full items-center rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-orange-400 hover:text-orange-300"
                  >
                    <span className="truncate">
                      {vehicle.licensePlate} · {vehicle.brand} {vehicle.model}
                    </span>
                  </Link>
                ))}

                {hiddenVehiclesCount > 0 ? (
                  <Link
                    href={`/customers/${customer.id}#customer-vehicles-heading`}
                    className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:border-orange-400 hover:text-orange-300"
                  >
                    +{hiddenVehiclesCount} más
                  </Link>
                ) : null}
              </div>
            ) : (
              <p className="flex h-full items-center text-sm text-slate-500">
                Sin vehículos asociados
              </p>
            )}
          </section>
        </div>

        <aside className="w-full shrink-0 lg:w-56">
          <div className="flex h-full flex-col gap-3 lg:justify-center lg:border-l lg:border-slate-800 lg:pl-5">
            <Link
              href={`/customers/${customer.id}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-400"
            >
              Ver cliente
            </Link>

            <Link
              href={`/customers/${customer.id}/edit`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-100 transition hover:border-orange-400 hover:text-orange-300"
            >
              Editar cliente
            </Link>

            <Link
              href={`/vehicles/new?customerId=${customer.id}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-100 transition hover:border-orange-400 hover:text-orange-300"
            >
              Cargar vehículo
            </Link>
          </div>
        </aside>
      </div>
    </article>
  );
}