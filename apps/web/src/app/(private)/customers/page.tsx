import type { Metadata } from "next";
import Link from "next/link";
import { getCustomers } from "../../../features/customers/customers.server";

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
    <section className="space-y-8">
      <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">
              Clientes
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              Base de clientes
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Registro operativo de clientes del taller. Desde acá podés crear
              clientes y luego asociarles vehículos.
            </p>
          </div>

          <Link
            href="/customers/new"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-400"
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
          <p className="text-sm text-slate-400">
            {customers.length} cliente{customers.length === 1 ? "" : "s"}
          </p>
        </div>

        {customers.length > 0 ? (
          <div className="grid gap-4">
            {customers.map((customer) => (
              <article
                key={customer.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-white">
                      {customer.fullName}
                    </h2>
                    <div className="mt-3 grid gap-2 text-sm text-slate-400 md:grid-cols-3">
                      <p>{customer.phone ?? "Sin teléfono"}</p>
                      <p>{customer.email ?? "Sin email"}</p>
                      <p>{customer.address ?? "Sin dirección"}</p>
                    </div>
                    {customer.notes ? (
                      <p className="mt-4 text-sm leading-6 text-slate-500">
                        {customer.notes}
                      </p>
                    ) : null}
                  </div>

                  <Link
                    href={`/vehicles/new?customerId=${customer.id}`}
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-100 transition hover:border-orange-400 hover:text-orange-300"
                  >
                    Cargar vehículo
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-8">
            <h2 className="text-lg font-semibold text-white">
              Todavía no hay clientes
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Creá el primer cliente para poder asociarle vehículos y órdenes
              de trabajo.
            </p>
          </div>
        )}
      </section>
    </section>
  );
}