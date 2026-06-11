import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "../../../components/ui/EmptyState";
import { getCustomers } from "../../../features/customers/customers.server";
import type { Customer } from "../../../features/customers/types";

export const metadata: Metadata = {
  title: "Clientes",
};

type CustomersPageProps = {
  searchParams: Promise<{
    search?: string | string[];
  }>;
};

/**
 * Customers list page.
 *
 * Provides the minimum operational customer view required before creating
 * vehicles associated with customers. Search is handled server-side over the
 * already fetched customer list to avoid expanding backend scope at MVP stage.
 */
export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const [customers, resolvedSearchParams] = await Promise.all([
    getCustomers(),
    searchParams,
  ]);

  const search = normalizeSearchParam(resolvedSearchParams.search);
  const filteredCustomers = filterCustomers(customers, search);
  const hasSearch = search.length > 0;

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

        <form className="mt-6 flex flex-col gap-3 sm:flex-row" role="search">
          <label htmlFor="search" className="sr-only">
            Buscar clientes
          </label>

          <input
            id="search"
            name="search"
            type="search"
            defaultValue={search}
            placeholder="Buscar por nombre, teléfono, email, dirección o notas..."
            className="h-11 min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
          />

          <button
            type="submit"
            className="h-11 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-400"
          >
            Buscar
          </button>

          {hasSearch ? (
            <Link
              href="/customers"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
            >
              Limpiar
            </Link>
          ) : null}
        </form>
      </header>

      <section aria-labelledby="customers-results-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2
            id="customers-results-heading"
            className="text-lg font-semibold text-white"
          >
            {hasSearch ? "Resultados" : "Registrados"}
          </h2>
          <p className="shrink-0 text-sm text-slate-400">
            {filteredCustomers.length} cliente
            {filteredCustomers.length === 1 ? "" : "s"}
          </p>
        </div>

        {filteredCustomers.length > 0 ? (
          <div className="grid gap-4">
            {filteredCustomers.map((customer) => (
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
            eyebrow={hasSearch ? "Sin resultados" : "Primer paso"}
            title={
              hasSearch
                ? "No se encontraron clientes"
                : "Todavía no hay clientes cargados"
            }
            description={
              hasSearch
                ? "Probá limpiar la búsqueda o buscar por otro nombre, teléfono, email, dirección o nota interna."
                : "Creá el primer cliente para poder asociarle vehículos, abrir fichas y registrar órdenes de trabajo."
            }
            actions={
              hasSearch
                ? [
                    {
                      label: "Limpiar búsqueda",
                      href: "/customers",
                      variant: "primary",
                    },
                    {
                      label: "Crear cliente",
                      href: "/customers/new",
                      variant: "secondary",
                    },
                  ]
                : [
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
                  ]
            }
          />
        )}
      </section>
    </section>
  );
}

/**
 * Normalizes a Next.js search param into a single trimmed string.
 */
function normalizeSearchParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return (value[0] ?? "").trim();
  }

  return (value ?? "").trim();
}

/**
 * Filters customers by the current search value.
 */
function filterCustomers(customers: Customer[], search: string): Customer[] {
  if (!search) {
    return customers;
  }

  const normalizedSearch = normalizeText(search);

  return customers.filter((customer) =>
    matchesCustomerSearch(customer, normalizedSearch),
  );
}

/**
 * Checks if a customer matches the normalized search term.
 */
function matchesCustomerSearch(
  customer: Customer,
  normalizedSearch: string,
): boolean {
  const searchableValues = [
    customer.fullName,
    customer.phone,
    customer.email,
    customer.address,
    customer.notes,
  ];

  return searchableValues.some((value) =>
    normalizeText(value ?? "").includes(normalizedSearch),
  );
}

/**
 * Normalizes text for case-insensitive and accent-insensitive search.
 */
function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

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