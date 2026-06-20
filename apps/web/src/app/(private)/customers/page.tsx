import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Pagination } from "../../../components/ui/Pagination";
import { SearchForm } from "../../../components/ui/SearchForm";
import { CustomerCard } from "../../../features/customers/components/CustomerCard";
import { getPaginatedCustomers } from "../../../features/customers/customers.server";

export const metadata: Metadata = {
  title: "Clientes",
};

const CUSTOMERS_PAGE_LIMIT = 10;

type CustomersPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    page?: string | string[];
  }>;
};

/**
 * Customers list page.
 *
 * Search and pagination are handled server-side by the API so the list remains
 * performant when the workshop starts accumulating real operational data.
 */
export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const resolvedSearchParams = await searchParams;
  const search = normalizeSearchParam(resolvedSearchParams.search);
  const page = normalizePageParam(resolvedSearchParams.page);

  const customersPage = await getPaginatedCustomers({
    search: search || undefined,
    page,
    limit: CUSTOMERS_PAGE_LIMIT,
  });

  const customers = customersPage.data;
  const meta = customersPage.meta;
  const hasSearch = search.length > 0;
  const hasCustomers = customers.length > 0;

  return (
    <section className="space-y-6 sm:space-y-8">
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div
          aria-hidden="true"
          className="absolute right-0 top-0 h-36 w-36 translate-x-12 -translate-y-14 rounded-full bg-primary/10 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-24 w-48 -translate-x-16 translate-y-12 rounded-full bg-carbon/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              Clientes
            </p>

            <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
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

        <div className="relative">
          <SearchForm
            id="customers-search"
            label="Buscar"
            defaultValue={search}
            placeholder="Buscar por nombre, teléfono, email, dirección o notas..."
            clearHref="/customers"
            showClearAction={hasSearch}
          />
        </div>
      </header>

      <section
        aria-labelledby="customers-results-heading"
        className="space-y-4"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h2
              id="customers-results-heading"
              className="font-display text-lg font-black uppercase tracking-[0.04em] text-foreground"
            >
              {hasSearch ? "Resultados" : "Registrados"}
            </h2>

            {meta.totalItems > 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Página {meta.page} de {meta.totalPages}
              </p>
            ) : null}
          </div>

          <p className="shrink-0 text-sm font-semibold text-muted-foreground">
            {meta.totalItems} cliente{meta.totalItems === 1 ? "" : "s"}
          </p>
        </div>

        {hasCustomers ? (
          <>
            <div className="grid gap-4">
              {customers.map((customer, index) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  variant={index % 2 === 0 ? "accent" : "neutral"}
                />
              ))}
            </div>

            <Pagination
              basePath="/customers"
              currentPage={meta.page}
              totalPages={meta.totalPages}
              searchParams={{
                search: search || undefined,
              }}
              ariaLabel="Paginación de clientes"
            />
          </>
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
 * Normalizes a page search param into a safe positive integer.
 */
function normalizePageParam(value: string | string[] | undefined): number {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = rawValue ? Number(rawValue) : 1;

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return 1;
  }

  return parsedValue;
}