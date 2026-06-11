import Link from "next/link";
import type { Customer } from "../types";

type CustomerCardProps = {
  customer: Customer;
};

/**
 * Displays a customer summary with the main operational actions.
 *
 * The card groups contact information and notes into clearer visual sections so
 * the data does not feel disconnected from the container.
 */
export function CustomerCard({ customer }: CustomerCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <header className="border-b border-slate-800 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
              Cliente
            </p>

            <h2 className="mt-2 wrap-break-word text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {customer.fullName}
            </h2>
          </header>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <CustomerMetaItem
              label="Teléfono"
              value={customer.phone ?? "Sin teléfono"}
            />
            <CustomerMetaItem
              label="Email"
              value={customer.email ?? "Sin email"}
            />
            <CustomerMetaItem
              label="Dirección"
              value={customer.address ?? "Sin dirección"}
            />
          </div>

          {customer.notes ? (
            <section
              aria-labelledby={`customer-notes-${customer.id}`}
              className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-4"
            >
              <h3
                id={`customer-notes-${customer.id}`}
                className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
              >
                Notas internas
              </h3>

              <p className="mt-3 wrap-break-word text-sm leading-6 text-slate-300">
                {customer.notes}
              </p>
            </section>
          ) : null}
        </div>

        <aside className="w-full shrink-0 lg:w-56">
          <div className="flex flex-col gap-3 lg:border-l lg:border-slate-800 lg:pl-5">
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

type CustomerMetaItemProps = {
  label: string;
  value: string;
};

/**
 * Compact metadata block for customer contact information.
 */
function CustomerMetaItem({ label, value }: CustomerMetaItemProps) {
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