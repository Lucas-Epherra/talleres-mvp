import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError } from "../../../../../lib/api";
import { EditVehicleForm } from "../../../../../features/vehicles/components/EditVehicleForm";
import { getVehicleProfile } from "../../../../../features/vehicles/vehicles.server";
import type { VehicleProfile } from "../../../../../features/vehicles/types";

type EditVehiclePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Editar vehículo",
};

/**
 * Vehicle edit page.
 *
 * Fetches the current vehicle profile server-side and delegates interactive
 * PATCH behavior to the edit vehicle form leaf Client Component.
 */
export default async function EditVehiclePage({ params }: EditVehiclePageProps) {
  const { id } = await params;
  const profile = await resolveVehicleProfile(id);

  return (
    <section className="space-y-8">
      <header className="rounded-[1.35rem] border border-border bg-surface/85 p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <Link
          href={`/vehicles/${profile.vehicle.id}`}
          className="text-sm font-bold text-primary transition hover:text-primary-hover"
        >
          ← Volver a la ficha
        </Link>

        <p className="mt-6 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
          Editar vehículo
        </p>

        <h1 className="mt-3 wrap-break-word font-display text-2xl font-black uppercase tracking-[0.04em] text-white sm:text-3xl">
          {profile.vehicle.licensePlate}
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Corregí patente, marca, modelo, año, kilometraje o notas internas del
          vehículo. El cliente asociado no se modifica desde esta pantalla.
        </p>
      </header>

      <EditVehicleForm profile={profile} />
    </section>
  );
}

/**
 * Resolves the vehicle profile and maps backend 404 responses to the Next.js
 * not found boundary.
 */
async function resolveVehicleProfile(id: string): Promise<VehicleProfile> {
  try {
    return await getVehicleProfile(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}