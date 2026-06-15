import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SearchForm } from "../../../components/ui/SearchForm";
import { CustomerCard } from "../../../features/customers/components/CustomerCard";
import { getCustomers } from "../../../features/customers/customers.server";
import type { Customer } from "../../../features/customers/types";
import { getVehicles } from "../../../features/vehicles/vehicles.server";
import type { VehicleListItem } from "../../../features/vehicles/types";

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
  const [customers, vehicles, resolvedSearchParams] = await Promise.all([
    getCustomers(),
    getVehicles(),
    searchParams,
  ]);

  const search = normalizeSearchParam(resolvedSearchParams.search);
  const filteredCustomers = filterCustomers(customers, search);
  const hasSearch = search.length > 0;

  return (
    <section className="space-y-6 sm:space-y-8">
      <header className="rounded-[1.35rem] border border-border bg-surface/85 p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              Clientes
            </p>

            <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-white sm:text-3xl">
              Base de clientes
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Registro operativo de clientes del taller. Desde acá podés crear
              clientes y luego asociarles vehículos.
            </p>
          </div>

          <Link
            href="/customers/new"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-[0_14px_35px_rgba(214,40,40,0.22)] transition hover:bg-primary-hover sm:w-auto"
          >
            Nuevo cliente
          </Link>
        </div>

        <SearchForm
          id="customers-search"
          label="Buscar"
          defaultValue={search}
          placeholder="Buscar por nombre, teléfono, email, dirección o notas..."
          clearHref="/customers"
          showClearAction={hasSearch}
        />
      </header>

      <section aria-labelledby="customers-results-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2
            id="customers-results-heading"
            className="font-display text-lg font-black uppercase tracking-[0.04em] text-white"
          >
            {hasSearch ? "Resultados" : "Registrados"}
          </h2>

          <p className="shrink-0 text-sm font-semibold text-muted-foreground">
            {filteredCustomers.length} cliente
            {filteredCustomers.length === 1 ? "" : "s"}
          </p>
        </div>

        {filteredCustomers.length > 0 ? (
          <div className="grid gap-4">
            {filteredCustomers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                vehicles={getCustomerVehicles(vehicles, customer.id)}
              />
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
 * Returns the vehicles associated with the selected customer.
 */
function getCustomerVehicles(
  vehicles: VehicleListItem[],
  customerId: string,
): VehicleListItem[] {
  return vehicles.filter((vehicle) => vehicle.customer.id === customerId);
}