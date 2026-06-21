import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Pagination } from "../../../components/ui/Pagination";
import { SearchForm } from "../../../components/ui/SearchForm";
import { VehicleCard } from "../../../features/vehicles/components/VehicleCard";
import { getPaginatedVehicles } from "../../../features/vehicles/vehicles.server";
import { normalizeSearchParam } from "../../../lib/format";

export const metadata: Metadata = {
  title: "Vehículos",
};

const VEHICLES_PAGE_LIMIT = 10;

type VehiclesPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    page?: string | string[];
  }>;
};

/**
 * Vehicles list page.
 *
 * Search and pagination are handled server-side by the API so the list remains
 * performant when the workshop starts accumulating real operational data.
 */
export default async function VehiclesPage({
  searchParams,
}: VehiclesPageProps) {
  const resolvedSearchParams = await searchParams;
  const search = normalizeSearchParam(resolvedSearchParams.search);
  const page = normalizePageParam(resolvedSearchParams.page);

  const vehiclesPage = await getPaginatedVehicles({
    search: search || undefined,
    page,
    limit: VEHICLES_PAGE_LIMIT,
  });

  const vehicles = vehiclesPage.data;
  const meta = vehiclesPage.meta;
  const hasSearch = Boolean(search);
  const hasVehicles = vehicles.length > 0;

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
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover sm:w-auto"
          >
            Nuevo vehículo
          </Link>
        </div>

        <div className="relative">
          <SearchForm
            id="vehicles-search"
            label="Buscar"
            defaultValue={search}
            placeholder="Buscar por patente, cliente o teléfono..."
            clearHref="/vehicles"
            showClearAction={hasSearch}
          />
        </div>
      </header>

      <section aria-labelledby="vehicles-results-heading" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h2
              id="vehicles-results-heading"
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
              }}
              ariaLabel="Paginación de vehículos"
            />
          </>
        ) : (
          <EmptyState
            eyebrow={hasSearch ? "Sin resultados" : "Primer vehículo"}
            title={
              hasSearch
                ? "No se encontraron vehículos"
                : "Todavía no hay vehículos cargados"
            }
            description={
              hasSearch
                ? "Probá limpiar la búsqueda o buscar por otra patente, cliente, marca, modelo o teléfono."
                : "Cargá el primer vehículo para empezar a construir su ficha, asociar cliente y registrar órdenes de trabajo."
            }
            actions={
              hasSearch
                ? [
                    {
                      label: "Limpiar búsqueda",
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
