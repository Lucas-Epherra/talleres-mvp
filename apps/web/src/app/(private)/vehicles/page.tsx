import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SearchForm } from "../../../components/ui/SearchForm";
import { VehicleCard } from "../../../features/vehicles/components/VehicleCard";
import { getVehicles } from "../../../features/vehicles/vehicles.server";
import { normalizeSearchParam } from "../../../lib/format";

export const metadata: Metadata = {
  title: "Vehículos",
};

type VehiclesPageProps = {
  searchParams: Promise<{
    search?: string | string[];
  }>;
};

/**
 * Vehicles list page.
 *
 * Uses server-side search through the backend API. This keeps the route simple,
 * bookmarkable and compatible with httpOnly cookie authentication.
 */
export default async function VehiclesPage({ searchParams }: VehiclesPageProps) {
  const resolvedSearchParams = await searchParams;
  const search = normalizeSearchParam(resolvedSearchParams.search);
  const vehicles = await getVehicles({ search });
  const hasSearch = Boolean(search);

  return (
    <section className="space-y-6 sm:space-y-8">
      <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">
              Vehículos
            </p>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Fichas del taller
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Buscá por patente, marca, modelo, cliente o teléfono. Cada
              vehículo centraliza cliente, órdenes activas e historial.
            </p>
          </div>

          <Link
            href="/vehicles/new"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-400 sm:w-auto"
          >
            Nuevo vehículo
          </Link>
        </div>

        <SearchForm
          id="vehicles-search"
          label="Buscar"
          defaultValue={search}
          placeholder="Buscar por patente, cliente o teléfono..."
          clearHref="/vehicles"
          showClearAction={hasSearch}
        />
      </header>

      <section aria-labelledby="vehicles-results-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2
            id="vehicles-results-heading"
            className="text-lg font-semibold text-white"
          >
            Resultados
          </h2>

          <p className="shrink-0 text-sm text-slate-400">
            {vehicles.length} vehículo{vehicles.length === 1 ? "" : "s"}
          </p>
        </div>

        {vehicles.length > 0 ? (
          <div className="grid gap-4">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
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