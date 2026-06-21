import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ApiError } from "../../../../lib/api";
import { CreateWorkOrderForm } from "../../../../features/work-orders/components/CreateWorkOrderForm";
import { getVehicleProfile } from "../../../../features/vehicles/vehicles.server";
import type { VehicleProfile } from "../../../../features/vehicles/types";

export const metadata: Metadata = {
  title: "Nueva orden de trabajo",
};

type NewWorkOrderPageProps = {
  searchParams: Promise<{
    vehicleId?: string | string[];
  }>;
};

/**
 * New work order page.
 *
 * This MVP flow expects vehicleId from the vehicle profile:
 * /work-orders/new?vehicleId=VEHICLE_ID
 *
 * The technical vehicle id is used only to fetch and submit data. The UI shows
 * human-readable vehicle and customer context.
 */
export default async function NewWorkOrderPage({
  searchParams,
}: NewWorkOrderPageProps) {
  const resolvedSearchParams = await searchParams;
  const vehicleId = getSingleSearchParamValue(resolvedSearchParams.vehicleId);

  if (!vehicleId) {
    return (
      <section className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div
          aria-hidden="true"
          className="absolute right-0 top-0 h-36 w-36 translate-x-12 -translate-y-14 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Nueva orden
          </p>

          <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
            Falta seleccionar un vehículo
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Para crear una orden de trabajo en este flujo, primero entrá a la
            ficha de un vehículo y usá la acción “Nueva orden de trabajo”.
          </p>

          <Link
            href="/vehicles"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-[0_14px_35px_rgba(214,40,40,0.22)] transition hover:bg-primary-hover"
          >
            Ir a vehículos
          </Link>
        </div>
      </section>
    );
  }

  const vehicleProfile = await getVehicleProfileOrNotFound(vehicleId);

  return (
    <section>
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div
          aria-hidden="true"
          className="absolute right-0 top-0 h-36 w-36 translate-x-12 -translate-y-14 rounded-full bg-primary/10 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-24 w-48 -translate-x-16 translate-y-12 rounded-full bg-carbon/10 blur-3xl"
        />

        <div className="relative">
          <Link
            href={`/vehicles/${vehicleProfile.vehicle.id}`}
            className="text-sm font-bold text-primary transition hover:text-primary-hover"
          >
            ← Volver a la ficha del vehículo
          </Link>

          <p className="mt-6 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Nueva orden
          </p>

          <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
            Crear orden de trabajo
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Registrá el problema reportado, kilometraje de ingreso, diagnóstico,
            trabajos, repuestos y costos asociados a este vehículo.
          </p>
        </div>
      </header>

      <CreateWorkOrderForm
        vehicle={{
          id: vehicleProfile.vehicle.id,
          licensePlate: vehicleProfile.vehicle.licensePlate,
          brand: vehicleProfile.vehicle.brand,
          model: vehicleProfile.vehicle.model,
          customerName: vehicleProfile.customer.fullName,
          customerPhone: vehicleProfile.customer.phone,
        }}
      />
    </section>
  );
}

/**
 * Fetches the selected vehicle profile and converts backend 404 responses into
 * Next notFound.
 */
async function getVehicleProfileOrNotFound(
  vehicleId: string,
): Promise<VehicleProfile> {
  try {
    return await getVehicleProfile(vehicleId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}

/**
 * Normalizes a query param that may arrive as a single value or an array.
 */
function getSingleSearchParamValue(
  value: string | string[] | undefined,
): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}
