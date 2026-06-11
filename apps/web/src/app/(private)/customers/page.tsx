import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "../../../components/ui/EmptyState";
import { getCustomers } from "../../../features/customers/customers.server";
import type { Customer } from "../../../features/customers/types";

export const metadata: Metadata = {
  title: "Clientes",
};

/**
 * Customers list page.
 *
 * Provides the minimum operational customer view required before creating
 * vehicles associated with customers.
 */
export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <section className="space-y-6 sm:space-y-8">
      <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">
              Clientes
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Base de clientes
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Registro operativo de clientes del taller. Desde acá podés crear
              clientes y luego asociarles vehículos.
            </p>
          </div>

          <Link
            href="/customers/new"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-400 sm:w-auto"
          >
            Nuevo cliente
          </Link>
        </div>
      </header>

      <section aria-labelledby="customers-results-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2
            id="customers-results-heading"
            className="text-lg font-semibold text-white"
          >
            Registrados
          </h2>
          <p className="shrink-0 text-sm text-slate-400">
            {customers.length} cliente{customers.length === 1 ? "" : "s"}
          </p>
        </div>

        {customers.length > 0 ? (
          <div className="grid gap-4">
            {customers.map((customer) => (
              <article
                key={customer.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="wrap-break-word text-xl font-semibold tracking-tight text-white">
                      {customer.fullName}
                    </h2>
                    <div className="mt-3 grid gap-2 text-sm text-slate-400 md:grid-cols-3">
                      <p className="wrap-break-word">
                        {customer.phone ?? "Sin teléfono"}
                      </p>
                      <p className="wrap-break-word">
                        {customer.email ?? "Sin email"}
                      </p>
                      <p className="wrap-break-word">
                        {customer.address ?? "Sin dirección"}
                      </p>
                    </div>
                    {customer.notes ? (
                      <p className="mt-4 wrap-break-word text-sm leading-6 text-slate-500">
                        {customer.notes}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                    <Link
                      href={`/customers/${customer.id}/edit`}
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-400 sm:w-auto"
                    >
                      Editar cliente
                    </Link>

                    <Link
                      href={buildCustomerVehiclesHref(customer)}
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-100 transition hover:border-orange-400 hover:text-orange-300 sm:w-auto"
                    >
                      Ver vehículos
                    </Link>

                    <Link
                      href={`/vehicles/new?customerId=${customer.id}`}
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-100 transition hover:border-orange-400 hover:text-orange-300 sm:w-auto"
                    >
                      Cargar vehículo
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            eyebrow="Primer paso"
            title="Todavía no hay clientes cargados"
            description="Creá el primer cliente para poder asociarle vehículos, abrir fichas y registrar órdenes de trabajo."
            actions={[
              {
                label: "Crear cliente",
                href: "/customers/new",
                variant: "primary",
              },
              {
                label: "Ver vehículos",
                href: "/vehicles",
                variant: "secondary",
              },
            ]}
          />
        )}
      </section>
    </section>
  );
}

/**
 * Builds the vehicles list URL filtered by customer data.
 *
 * The vehicles screen currently supports a generic search query, not a strict
 * customerId filter. This keeps the UI useful without expanding backend scope.
 */
/**
 * Builds the vehicles list URL filtered by customer name.
 *
 * The vehicles screen currently supports a generic search query, not a strict
 * customerId filter. Searching by customer name keeps the shortcut readable and
 * predictable for the user.
 */
function buildCustomerVehiclesHref(customer: Customer): string {
  return `/vehicles?search=${encodeURIComponent(customer.fullName)}`;
}