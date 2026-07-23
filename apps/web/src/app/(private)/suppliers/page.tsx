import { Archive, Handshake, Plus, WalletCards } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Pagination } from "../../../components/ui/Pagination";
import { SearchForm } from "../../../components/ui/SearchForm";
import { SuppliersTable } from "../../../features/suppliers/components/SuppliersTable";
import { getPaginatedSuppliers } from "../../../features/suppliers/suppliers.server";
import {
  SUPPLIER_ARCHIVE_STATUSES,
  type SupplierArchiveStatus,
  type SupplierListItem,
} from "../../../features/suppliers/types";
import { formatMoney } from "../../../lib/format";

export const metadata: Metadata = {
  title: "Proveedores",
};

const SUPPLIERS_PAGE_LIMIT = 10;

type SuppliersPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    page?: string | string[];
    archiveStatus?: string | string[];
  }>;
};

/**
 * Supplier module entry point.
 *
 * This first frontend version creates a navigable supplier base with financial
 * metrics already prepared for later catalog, payment and report flows.
 */
export default async function SuppliersPage({ searchParams }: SuppliersPageProps) {
  const resolvedSearchParams = await searchParams;
  const search = normalizeSearchParam(resolvedSearchParams.search);
  const page = normalizePageParam(resolvedSearchParams.page);
  const archiveStatus = normalizeArchiveStatusParam(
    resolvedSearchParams.archiveStatus,
  );
  const suppliersPage = await getPaginatedSuppliers({
    search: search || undefined,
    page,
    limit: SUPPLIERS_PAGE_LIMIT,
    archiveStatus,
  });
  const suppliers = suppliersPage.data;
  const meta = suppliersPage.meta;
  const hasSearch = search.length > 0;
  const hasFilters = hasSearch || archiveStatus !== "active";

  return (
    <section className="space-y-6 sm:space-y-8">
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              <Handshake className="size-4 shrink-0" aria-hidden="true" />
              Proveedores
            </p>

            <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
              Proveedores del taller
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Base de proveedores para compras, repuestos, pagos, deuda y
              margen. Este módulo prepara los datos que después alimentan los
              reportes del taller.
            </p>
          </div>

          <Link
            href="/suppliers/new"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover sm:w-auto"
          >
            <Plus className="size-4 shrink-0" aria-hidden="true" />
            Nuevo proveedor
          </Link>
        </div>

        <SearchForm
          id="suppliers-search"
          label="Buscar"
          defaultValue={search}
          placeholder="Buscar por proveedor, contacto, teléfono, CUIT o categoría..."
          clearHref={buildSuppliersHref({ archiveStatus })}
          showClearAction={hasSearch}
        />

        <SupplierArchiveStatusFilters
          currentArchiveStatus={archiveStatus}
          search={search || undefined}
        />
      </header>

      <SuppliersSummary suppliers={suppliers} />

      <section aria-labelledby="suppliers-results-heading" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h2
              id="suppliers-results-heading"
              className="font-display text-lg font-black uppercase tracking-[0.04em] text-foreground"
            >
              {getResultsTitle(archiveStatus, hasSearch)}
            </h2>

            {meta.totalItems > 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Página {meta.page} de {meta.totalPages}
              </p>
            ) : null}
          </div>

          <p className="shrink-0 text-sm font-semibold text-muted-foreground">
            {meta.totalItems} proveedor{meta.totalItems === 1 ? "" : "es"}
          </p>
        </div>

        {suppliers.length > 0 ? (
          <>
            <SuppliersTable suppliers={suppliers} />

            <Pagination
              basePath="/suppliers"
              currentPage={meta.page}
              totalPages={meta.totalPages}
              searchParams={{
                search: search || undefined,
                archiveStatus:
                  archiveStatus !== "active" ? archiveStatus : undefined,
              }}
              ariaLabel="Paginación de proveedores"
            />
          </>
        ) : (
          <EmptyState
            eyebrow={hasFilters ? "Sin resultados" : "Proveedores"}
            title={
              hasFilters
                ? "No encontramos proveedores con esos filtros"
                : "Todavía no hay proveedores cargados"
            }
            description={
              hasFilters
                ? "Probá limpiar la búsqueda o cambiar el estado de archivo."
                : "Cargá tus proveedores para empezar a preparar catálogo de repuestos, pagos, deuda y reportes de compras."
            }
            actions={[
              ...(hasFilters
                ? [
                    {
                      label: "Limpiar filtros",
                      href: "/suppliers",
                      variant: "secondary" as const,
                    },
                  ]
                : []),
              {
                label: "Nuevo proveedor",
                href: "/suppliers/new",
                variant: "primary" as const,
              },
            ]}
          />
        )}
      </section>
    </section>
  );
}

type SuppliersSummaryProps = {
  suppliers: SupplierListItem[];
};

/**
 * Compact summary for the current supplier result set.
 */
function SuppliersSummary({ suppliers }: SuppliersSummaryProps) {
  const purchasedTotal = suppliers.reduce(
    (total, supplier) => total + toNumber(supplier.metrics.purchasedTotal),
    0,
  );
  const paidTotal = suppliers.reduce(
    (total, supplier) => total + toNumber(supplier.metrics.paidTotal),
    0,
  );
  const pendingBalance = suppliers.reduce(
    (total, supplier) => total + toNumber(supplier.metrics.pendingBalance),
    0,
  );
  const suppliersWithDebt = suppliers.filter(
    (supplier) => toNumber(supplier.metrics.pendingBalance) > 0,
  ).length;

  return (
    <section
      aria-label="Resumen de proveedores"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <SummaryCard label="Comprado" value={formatMoney(purchasedTotal)} />
      <SummaryCard label="Abonado" value={formatMoney(paidTotal)} />
      <SummaryCard
        label="Deuda"
        value={formatMoney(pendingBalance)}
        tone={pendingBalance > 0 ? "warning" : "neutral"}
      />
      <SummaryCard
        label="Con deuda"
        value={`${suppliersWithDebt} proveedor${suppliersWithDebt === 1 ? "" : "es"}`}
      />
    </section>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  tone?: "neutral" | "warning";
};

/**
 * Small supplier metric card.
 */
function SummaryCard({ label, value, tone = "neutral" }: SummaryCardProps) {
  return (
    <div
      className={
        tone === "warning"
          ? "rounded-2xl border border-warning/45 bg-warning/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition hover:border-warning"
          : "rounded-2xl border border-border bg-surface-muted/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition hover:border-border-strong hover:bg-surface"
      }
    >
      <p
        className={
          tone === "warning"
            ? "text-[0.68rem] font-bold uppercase tracking-[0.22em] text-warning"
            : "text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary"
        }
      >
        {label}
      </p>

      <p className="mt-2 font-display text-xl font-black text-foreground">
        {value}
      </p>
    </div>
  );
}

type SupplierArchiveStatusFiltersProps = {
  currentArchiveStatus: SupplierArchiveStatus;
  search?: string;
};

/**
 * Server-rendered archive filters for supplier navigation.
 */
function SupplierArchiveStatusFilters({
  currentArchiveStatus,
  search,
}: SupplierArchiveStatusFiltersProps) {
  const filters: Array<{
    label: string;
    value: SupplierArchiveStatus;
    icon?: typeof Archive | typeof WalletCards;
  }> = [
    { label: "Disponibles", value: "active", icon: WalletCards },
    { label: "Archivados", value: "archived", icon: Archive },
    { label: "Todos", value: "all" },
  ];

  return (
    <section aria-labelledby="supplier-archive-filter-heading" className="mt-5">
      <div className="flex flex-col gap-1">
        <h2
          id="supplier-archive-filter-heading"
          className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary"
        >
          Estado de ficha
        </h2>

        <p className="text-xs leading-5 text-muted-foreground">
          Los proveedores archivados conservan historial y métricas, pero salen
          del flujo operativo diario.
        </p>
      </div>

      <nav aria-label="Filtro de estado de proveedor" className="mt-2 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const isActive = currentArchiveStatus === filter.value;
          const Icon = filter.icon;

          return (
            <Link
              key={filter.value}
              href={buildSuppliersHref({
                search,
                archiveStatus: filter.value,
              })}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-4 text-sm font-bold text-white"
                  : "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
              }
            >
              {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
              {filter.label}
            </Link>
          );
        })}
      </nav>
    </section>
  );
}

/**
 * Builds supplier list hrefs while preserving meaningful filters.
 */
function buildSuppliersHref({
  search,
  archiveStatus,
}: {
  search?: string;
  archiveStatus?: SupplierArchiveStatus;
}): string {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (archiveStatus && archiveStatus !== "active") {
    params.set("archiveStatus", archiveStatus);
  }

  const queryString = params.toString();

  return queryString ? `/suppliers?${queryString}` : "/suppliers";
}

function getResultsTitle(
  archiveStatus: SupplierArchiveStatus,
  hasSearch: boolean,
): string {
  if (hasSearch) {
    return "Resultados";
  }

  const titles: Record<SupplierArchiveStatus, string> = {
    active: "Proveedores disponibles",
    archived: "Proveedores archivados",
    all: "Todos los proveedores",
  };

  return titles[archiveStatus];
}

function normalizeArchiveStatusParam(
  value: string | string[] | undefined,
): SupplierArchiveStatus {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (SUPPLIER_ARCHIVE_STATUSES.some((status) => status === rawValue)) {
    return rawValue as SupplierArchiveStatus;
  }

  return "active";
}

function normalizeSearchParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return (value[0] ?? "").trim();
  }

  return (value ?? "").trim();
}

function normalizePageParam(value: string | string[] | undefined): number {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = rawValue ? Number(rawValue) : 1;

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return 1;
  }

  return parsedValue;
}

function toNumber(value: number | string): number {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}
