import { UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Pagination } from "../../../components/ui/Pagination";
import { SearchForm } from "../../../components/ui/SearchForm";
import { CustomerCard } from "../../../features/customers/components/CustomerCard";
import { getPaginatedCustomers } from "../../../features/customers/customers.server";
import {
  CUSTOMER_ARCHIVE_STATUSES,
  type CustomerArchiveStatus,
} from "../../../features/customers/types";

export const metadata: Metadata = {
  title: "Clientes",
};

const CUSTOMERS_PAGE_LIMIT = 10;

type CustomersPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    page?: string | string[];
    archiveStatus?: string | string[];
  }>;
};

/**
 * Customers list page.
 *
 * Search, archive filtering and pagination are handled server-side by the API
 * so the list remains performant when the workshop starts accumulating data.
 */
export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const resolvedSearchParams = await searchParams;
  const search = normalizeSearchParam(resolvedSearchParams.search);
  const page = normalizePageParam(resolvedSearchParams.page);
  const archiveStatus = normalizeArchiveStatusParam(
    resolvedSearchParams.archiveStatus,
  );

  const customersPage = await getPaginatedCustomers({
    search: search || undefined,
    archiveStatus,
    page,
    limit: CUSTOMERS_PAGE_LIMIT,
  });

  const customers = customersPage.data;
  const meta = customersPage.meta;
  const hasSearch = search.length > 0;
  const hasArchiveFilter = archiveStatus !== "active";
  const hasCustomers = customers.length > 0;

  return (
    <section className="space-y-6 sm:space-y-8">
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
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
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover sm:w-auto"
          >
            <UserPlus className="size-4 shrink-0" aria-hidden="true" />
            Nuevo cliente
          </Link>
        </div>

        <div className="relative">
          <SearchForm
            id="customers-search"
            label="Buscar"
            defaultValue={search}
            placeholder="Buscar por nombre, teléfono, email, dirección o notas..."
            clearHref={buildCustomersHref({
              archiveStatus,
            })}
            showClearAction={hasSearch}
          />
        </div>

        <CustomerArchiveFilters
          currentStatus={archiveStatus}
          search={search || undefined}
        />
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
              {getResultsTitle(hasSearch, archiveStatus)}
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
                archiveStatus: hasArchiveFilter ? archiveStatus : undefined,
              }}
              ariaLabel="Paginación de clientes"
            />
          </>
        ) : (
          <EmptyState
            eyebrow={getEmptyEyebrow(hasSearch, archiveStatus)}
            title={getEmptyTitle(hasSearch, archiveStatus)}
            description={getEmptyDescription(hasSearch, archiveStatus)}
            actions={
              hasSearch || hasArchiveFilter
                ? [
                    {
                      label: "Limpiar filtros",
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

type CustomerArchiveFiltersProps = {
  currentStatus: CustomerArchiveStatus;
  search?: string;
};

/**
 * Server-rendered archive status filter for customer list navigation.
 */
function CustomerArchiveFilters({
  currentStatus,
  search,
}: CustomerArchiveFiltersProps) {
  const filters: Array<{
    label: string;
    value: CustomerArchiveStatus;
  }> = [
    {
      label: "Activos",
      value: "active",
    },
    {
      label: "Archivados",
      value: "archived",
    },
    {
      label: "Todos",
      value: "all",
    },
  ];

  return (
    <nav
      aria-label="Filtro de estado de archivo de clientes"
      className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
    >
      {filters.map((filter) => {
        const isActive = currentStatus === filter.value;

        return (
          <Link
            key={filter.value}
            href={buildCustomersHref({
              search,
              archiveStatus: filter.value,
            })}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white"
                : "inline-flex h-10 items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
            }
          >
            {filter.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Builds a customers href preserving only meaningful filters.
 */
function buildCustomersHref({
  search,
  archiveStatus,
}: {
  search?: string;
  archiveStatus?: CustomerArchiveStatus;
}): string {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (archiveStatus && archiveStatus !== "active") {
    params.set("archiveStatus", archiveStatus);
  }

  const queryString = params.toString();

  return queryString ? `/customers?${queryString}` : "/customers";
}

/**
 * Normalizes archive status params into the supported filter values.
 */
function normalizeArchiveStatusParam(
  value: string | string[] | undefined,
): CustomerArchiveStatus {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (
    CUSTOMER_ARCHIVE_STATUSES.some(
      (archiveStatus) => archiveStatus === rawValue,
    )
  ) {
    return rawValue as CustomerArchiveStatus;
  }

  return "active";
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

/**
 * Returns the title for the current result set.
 */
function getResultsTitle(
  hasSearch: boolean,
  archiveStatus: CustomerArchiveStatus,
): string {
  if (hasSearch) {
    return "Resultados";
  }

  if (archiveStatus === "archived") {
    return "Archivados";
  }

  if (archiveStatus === "all") {
    return "Todos los clientes";
  }

  return "Registrados";
}

/**
 * Returns an empty-state eyebrow for the current filters.
 */
function getEmptyEyebrow(
  hasSearch: boolean,
  archiveStatus: CustomerArchiveStatus,
): string {
  if (hasSearch) {
    return "Sin resultados";
  }

  if (archiveStatus === "archived") {
    return "Sin archivados";
  }

  return "Primer paso";
}

/**
 * Returns an empty-state title for the current filters.
 */
function getEmptyTitle(
  hasSearch: boolean,
  archiveStatus: CustomerArchiveStatus,
): string {
  if (hasSearch) {
    return "No se encontraron clientes";
  }

  if (archiveStatus === "archived") {
    return "No hay clientes archivados";
  }

  return "Todavía no hay clientes cargados";
}

/**
 * Returns an empty-state description for the current filters.
 */
function getEmptyDescription(
  hasSearch: boolean,
  archiveStatus: CustomerArchiveStatus,
): string {
  if (hasSearch) {
    return "Probá limpiar la búsqueda o buscar por otro nombre, teléfono, email, dirección o nota interna.";
  }

  if (archiveStatus === "archived") {
    return "Los clientes archivados quedan fuera del flujo operativo, pero se conservan para historial y trazabilidad.";
  }

  return "Creá el primer cliente para poder asociarle vehículos, abrir fichas y registrar órdenes de trabajo.";
}
