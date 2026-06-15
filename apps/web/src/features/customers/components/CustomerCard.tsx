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
    <article className="rounded-[1.35rem] border border-border bg-surface/80 p-5 shadow-(--shadow-industrial) ring-1 ring-white/3 transition hover:border-primary/45 hover:bg-surface sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="min-w-0 flex-1">
          <header className="flex flex-col gap-5 border-b border-border pb-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Cliente
              </p>

              <h2 className="mt-2 wrap-break-word font-display text-2xl font-black uppercase tracking-[0.02em] text-white">
                {customer.fullName}
              </h2>
            </div>

            <div className="min-w-0 md:max-w-xs md:text-right">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Teléfono
              </p>

              <p className="mt-2 wrap-break-word text-xl font-bold text-white sm:text-2xl">
                {customer.phone}
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
                    className="inline-flex max-w-full items-center rounded-full border border-border-strong bg-background/60 px-3 py-1.5 text-xs font-bold text-white transition hover:border-primary/60 hover:text-primary"
                  >
                    <span className="truncate">
                      {vehicle.licensePlate} · {vehicle.brand} {vehicle.model}
                    </span>
                  </Link>
                ))}

                {hiddenVehiclesCount > 0 ? (
                  <Link
                    href={`/customers/${customer.id}#customer-vehicles-heading`}
                    className="inline-flex items-center rounded-full border border-border-strong bg-background/60 px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:border-primary/60 hover:text-primary"
                  >
                    +{hiddenVehiclesCount} más
                  </Link>
                ) : null}
              </div>
            ) : (
              <p className="flex h-full items-center text-sm text-muted-foreground">
                Sin vehículos asociados
              </p>
            )}
          </section>
        </div>

        <aside className="w-full shrink-0 lg:w-56">
          <div className="flex h-full flex-col gap-3 lg:justify-center lg:border-l lg:border-border lg:pl-5">
            <Link
              href={`/customers/${customer.id}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-[0_14px_35px_rgba(214,40,40,0.22)] transition hover:bg-primary-hover"
            >
              Ver cliente
            </Link>

            <Link
              href={`/customers/${customer.id}/edit`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated"
            >
              Editar cliente
            </Link>

            <Link
              href={`/vehicles/new?customerId=${customer.id}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated"
            >
              Cargar vehículo
            </Link>
          </div>
        </aside>
      </div>
    </article>
  );
}