import Link from "next/link";
import type { CustomerListItem } from "../types";

type CustomerCardProps = {
  customer: CustomerListItem;
};

/**
 * Displays a compact customer summary for large customer lists.
 *
 * Full customer contact, vehicle and work order details are available from the
 * customer detail page, so this card only exposes key scanning information and
 * the vehicle count returned by the paginated backend endpoint.
 */
export function CustomerCard({ customer }: CustomerCardProps) {
  const vehicleCount = customer._count.vehicles;

  return (
    <article className="rounded-[1.1rem] border border-border bg-surface/80 p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 transition hover:border-primary/45 hover:bg-surface sm:rounded-[1.35rem] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="min-w-0 flex-1">
          <header className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-start md:justify-between md:pb-5">
            <div className="min-w-0">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-primary">
                Cliente
              </p>

              <h2 className="mt-2 wrap-anywhere font-display text-xl font-black uppercase tracking-[0.02em] text-white sm:text-2xl">
                {customer.fullName}
              </h2>
            </div>

            <div className="min-w-0 md:max-w-xs md:text-right">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Teléfono
              </p>

              <p className="mt-2 wrap-anywhere text-lg font-black text-white sm:text-2xl">
                {customer.phone}
              </p>
            </div>
          </header>

          <section
            aria-labelledby={`customer-summary-${customer.id}`}
            className="mt-4 grid gap-3 sm:grid-cols-3"
          >
            <h3 id={`customer-summary-${customer.id}`} className="sr-only">
              Resumen del cliente
            </h3>

            <CustomerSummaryItem
              label="Vehículos"
              value={`${vehicleCount} asociado${vehicleCount === 1 ? "" : "s"}`}
            />

            <CustomerSummaryItem
              label="Email"
              value={customer.email ?? "Sin cargar"}
            />

            <CustomerSummaryItem
              label="Dirección"
              value={customer.address ?? "Sin cargar"}
            />
          </section>
        </div>

        <aside className="w-full shrink-0 lg:w-56">
          <div className="grid gap-2 sm:grid-cols-3 lg:flex lg:h-full lg:flex-col lg:justify-center lg:gap-3 lg:border-l lg:border-border lg:pl-5">
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

/**
 * Renders a small customer summary datum.
 */
function CustomerSummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/45 p-3">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">
        {label}
      </p>

      <p className="mt-2 wrap-anywhere text-sm font-bold text-white">{value}</p>
    </div>
  );
}
