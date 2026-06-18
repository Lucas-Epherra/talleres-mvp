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
    <article className="rounded-[1.1rem] border border-border bg-surface/80 p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 transition hover:border-primary/45 hover:bg-surface sm:rounded-[1.35rem] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="min-w-0 flex-1">
          <header className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-start md:justify-between md:pb-5">
            <div className="min-w-0">
              <p className="wrap-anywhere text-[0.68rem] font-bold uppercase tracking-[0.18em] text-primary">
                {vehicle.licensePlate}
              </p>

              <h2 className="mt-2 wrap-anywhere font-display text-xl font-black uppercase tracking-[0.02em] text-white sm:text-2xl">
                {vehicle.brand} {vehicle.model}
              </h2>
            </div>

            <div className="min-w-0 md:max-w-xs md:text-right">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Cliente asociado
              </p>

              <Link
                href={`/customers/${vehicle.customer.id}`}
                className="mt-2 block wrap-anywhere text-lg font-black text-white transition hover:text-primary sm:text-2xl"
              >
                {vehicle.customer.fullName}
              </Link>
            </div>
          </header>

          <div className="mt-4 grid gap-2 sm:grid-cols-3 md:gap-3">
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
        </div>

        <aside className="w-full shrink-0 lg:w-48">
          <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:h-full lg:flex-col lg:gap-3 lg:border-l lg:border-border lg:pl-5">
            <Link
              href={`/vehicles/${vehicle.id}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-[0_14px_35px_rgba(214,40,40,0.22)] transition hover:bg-primary-hover"
            >
              Abrir ficha
            </Link>

            <Link
              href={`/customers/${vehicle.customer.id}`}
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

type VehicleMetaItemProps = {
  label: string;
  value: string;
};

/**
 * Compact metadata block for vehicle summary information.
 */
function VehicleMetaItem({ label, value }: VehicleMetaItemProps) {
  return (
    <div className="rounded-xl border border-border bg-background/55 p-3 sm:p-4">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-steel">
        {label}
      </p>

      <p className="mt-2 wrap-anywhere text-sm font-bold text-white">
        {value}
      </p>
    </div>
  );
}