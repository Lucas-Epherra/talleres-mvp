import type { Metadata } from "next";
import { normalizeSearchParam } from "../../../lib/format";
import { VehicleCard } from "../../../features/vehicles/components/VehicleCard";
import { getVehicles } from "../../../features/vehicles/vehicles.server";

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

  return (
    <section className="space-y-6 sm:space-y-8">
      <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">
          Vehículos
        </p>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Fichas del taller
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Buscá por patente, marca, modelo, cliente o teléfono. Cada vehículo
          centraliza cliente, órdenes activas e historial.
        </p>

        <form className="mt-6 flex flex-col gap-3 sm:flex-row" role="search">
          <label htmlFor="search" className="sr-only">
            Buscar vehículos
          </label>
          <input
            id="search"
            name="search"
            type="search"
            defaultValue={search}
            placeholder="Buscar por patente, cliente o teléfono..."
            className="h-11 min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
          />
          <button
            type="submit"
            className="h-11 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-400"
          >
            Buscar
          </button>
        </form>
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
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-white">
              No se encontraron vehículos
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Probá buscar por patente, nombre del cliente o teléfono. Si el
              vehículo todavía no existe, el próximo bloque será crear el alta.
            </p>
          </div>
        )}
      </section>
    </section>
  );
}