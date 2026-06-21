import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiError } from "../../../../lib/api";
import { VehicleProfileHeader } from "../../../../features/vehicles/components/VehicleProfileHeader";
import { VehicleWorkOrdersPanel } from "../../../../features/vehicles/components/VehicleWorkOrdersPanel";
import { getVehicleProfile } from "../../../../features/vehicles/vehicles.server";
import type { VehicleProfile } from "../../../../features/vehicles/types";

type VehicleProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Ficha del vehículo",
};

/**
 * Vehicle profile page.
 *
 * This is the main operational view of the product: vehicle data, customer
 * data, active work orders and historical work orders.
 */
export default async function VehicleProfilePage({
  params,
}: VehicleProfilePageProps) {
  const { id } = await params;
  const profile = await resolveVehicleProfile(id);

  return (
    <section className="space-y-8">
      <VehicleProfileHeader profile={profile} />

      <VehicleWorkOrdersPanel
        title="Órdenes activas"
        description="Trabajos pendientes, en progreso o listos para entregar."
        emptyMessage="Este vehículo no tiene órdenes activas."
        workOrders={profile.activeWorkOrders}
      />

      <VehicleWorkOrdersPanel
        title="Historial"
        description="Trabajos anteriores ya entregados."
        emptyMessage="Este vehículo todavía no tiene historial cerrado."
        workOrders={profile.history}
      />
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
