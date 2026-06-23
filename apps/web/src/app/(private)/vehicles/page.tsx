import { CarFront } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Pagination } from "../../../components/ui/Pagination";
import { SearchForm } from "../../../components/ui/SearchForm";
import { VehicleCard } from "../../../features/vehicles/components/VehicleCard";
import { getPaginatedVehicles } from "../../../features/vehicles/vehicles.server";
import {
  VEHICLE_ARCHIVE_STATUSES,
  type VehicleArchiveStatus,
} from "../../../features/vehicles/types";
import { normalizeSearchParam } from "../../../lib/format";

export const metadata: Metadata = {
  title: "Vehículos",
};

const VEHICLES_PAGE_LIMIT = 10;

type VehiclesPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    page?: string | string[];
    archiveStatus?: string | string[];
  }>;
};

/**
 * Vehicles list page.
 *
 * Search, archive filtering and pagination are handled server-side by the API
 * so the list remains performant when the workshop accumulates real data.
 */
export default async function VehiclesPage({
  searchParams,
}: VehiclesPageProps) {
  const resolvedSearchParams = await searchParams;
  const search = normalizeSearchParam(resolvedSearchParams.search);
  const page = normalizePageParam(resolvedSearchParams.page);
  const archiveStatus = normalizeArchiveStatusParam(
    resolvedSearchParams.archiveStatus,
  );

  const vehiclesPage = await getPaginatedVehicles({
    search: search || undefined,
    archiveStatus,
    page,
    limit: VEHICLES_PAGE_LIMIT,
  });

  const vehicles = vehiclesPage.data;
  const meta = vehiclesPage.meta;
  const hasSearch = Boolean(search);
  const hasArchiveFilter = archiveStatus !== "active";
  const hasVehicles = vehicles.length > 0;

  return (
    <section className="space-y-6 sm:space-y-8">
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              Vehículos
            </p>

            <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
              Fichas del taller
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Buscá por patente, marca, modelo, cliente o teléfono. Cada
              vehículo centraliza cliente, órdenes activas e historial.
            </p>
          </div>

          <Link
            href="/vehicles/new"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover sm:w-auto"
          >
            <CarFront className="size-4 shrink-0" aria-hidden="true" />
            Nuevo vehículo
          </Link>
        </div>

        <div className="relative">
          <SearchForm
            id="vehicles-search"
            label="Buscar"
            defaultValue={search}
            placeholder="Buscar por patente, cliente o teléfono..."
            clearHref={buildVehiclesHref({
              archiveStatus,
            })}
            showClearAction={hasSearch}
          />
        </div>

        <VehicleArchiveFilters
          currentStatus={archiveStatus}
          search={search || undefined}
        />
      </header>

      <section aria-labelledby="vehicles-results-heading" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h2
              id="vehicles-results-heading"
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
            {meta.totalItems} vehículo{meta.totalItems === 1 ? "" : "s"}
          </p>
        </div>

        {hasVehicles ? (
          <>
            <div className="grid gap-4">
              {vehicles.map((vehicle, index) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  variant={index % 2 === 0 ? "accent" : "neutral"}
                />
              ))}
            </div>

            <Pagination
              basePath="/vehicles"
              currentPage={meta.page}
              totalPages={meta.totalPages}
              searchParams={{
                search: search || undefined,
                archiveStatus: hasArchiveFilter ? archiveStatus : undefined,
              }}
              ariaLabel="Paginación de vehículos"
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
                      href: "/vehicles",
                      variant: "primary",
                    },
                    {
                      label: "Nuevo vehículo",
                      href: "/vehicles/new",
                      variant: "secondary",
                    },
                  ]
                : [
                    {
                      label: "Crear vehículo",
                      href: "/vehicles/new",
                      variant: "primary",
                    },
                    {
                      label: "Crear cliente",
                      href: "/customers/new",
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

type VehicleArchiveFiltersProps = {
  currentStatus: VehicleArchiveStatus;
  search?: string;
};

/**
 * Server-rendered archive status filter for vehicle list navigation.
 */
function VehicleArchiveFilters({
  currentStatus,
  search,
}: VehicleArchiveFiltersProps) {
  const filters: Array<{
    label: string;
    value: VehicleArchiveStatus;
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
      aria-label="Filtro de estado de archivo de vehículos"
      className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
    >
      {filters.map((filter) => {
        const isActive = currentStatus === filter.value;

        return (
          <Link
            key={filter.value}
            href={buildVehiclesHref({
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
 * Builds a vehicles href preserving only meaningful filters.
 */
function buildVehiclesHref({
  search,
  archiveStatus,
}: {
  search?: string;
  archiveStatus?: VehicleArchiveStatus;
}): string {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (archiveStatus && archiveStatus !== "active") {
    params.set("archiveStatus", archiveStatus);
  }

  const queryString = params.toString();

  return queryString ? `/vehicles?${queryString}` : "/vehicles";
}

/**
 * Normalizes archive status params into the supported filter values.
 */
function normalizeArchiveStatusParam(
  value: string | string[] | undefined,
): VehicleArchiveStatus {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (
    VEHICLE_ARCHIVE_STATUSES.some((archiveStatus) => archiveStatus === rawValue)
  ) {
    return rawValue as VehicleArchiveStatus;
  }

  return "active";
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
  archiveStatus: VehicleArchiveStatus,
): string {
  if (hasSearch) {
    return "Resultados";
  }

  if (archiveStatus === "archived") {
    return "Archivados";
  }

  if (archiveStatus === "all") {
    return "Todos los vehículos";
  }

  return "Registrados";
}

/**
 * Returns an empty-state eyebrow for the current filters.
 */
function getEmptyEyebrow(
  hasSearch: boolean,
  archiveStatus: VehicleArchiveStatus,
): string {
  if (hasSearch) {
    return "Sin resultados";
  }

  if (archiveStatus === "archived") {
    return "Sin archivados";
  }

  return "Primer vehículo";
}

/**
 * Returns an empty-state title for the current filters.
 */
function getEmptyTitle(
  hasSearch: boolean,
  archiveStatus: VehicleArchiveStatus,
): string {
  if (hasSearch) {
    return "No se encontraron vehículos";
  }

  if (archiveStatus === "archived") {
    return "No hay vehículos archivados";
  }

  return "Todavía no hay vehículos cargados";
}

/**
 * Returns an empty-state description for the current filters.
 */
function getEmptyDescription(
  hasSearch: boolean,
  archiveStatus: VehicleArchiveStatus,
): string {
  if (hasSearch) {
    return "Probá limpiar la búsqueda o buscar por otra patente, cliente, marca, modelo o teléfono.";
  }

  if (archiveStatus === "archived") {
    return "Los vehículos archivados quedan fuera del flujo operativo, pero se conservan para historial y trazabilidad.";
  }

  return "Cargá el primer vehículo para empezar a construir su ficha, asociar cliente y registrar órdenes de trabajo.";
}
