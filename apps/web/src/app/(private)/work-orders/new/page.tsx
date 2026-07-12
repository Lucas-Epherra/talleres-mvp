import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { CreateWorkOrderForm } from "../../../../features/work-orders/components/CreateWorkOrderForm";
import { getWorkOrderSupplierCatalog } from "../../../../features/work-orders/work-orders.server";
import { getVehicleProfile } from "../../../../features/vehicles/vehicles.server";
import type { VehicleProfile } from "../../../../features/vehicles/types";
import { ApiError } from "../../../../lib/api";

export const metadata: Metadata = {
  title: "Nueva orden",
};

type NewWorkOrderPageProps = {
  searchParams: Promise<{
    vehicleId?: string | string[];
  }>;
};

/**
 * Creates a new work order from an existing vehicle context.
 */
export default async function NewWorkOrderPage({
  searchParams,
}: NewWorkOrderPageProps) {
  const resolvedSearchParams = await searchParams;
  const vehicleId = normalizeSearchParam(resolvedSearchParams.vehicleId);

  if (!vehicleId) {
    redirect("/vehicles");
  }

  const [profile, supplierCatalog] = await Promise.all([
    getVehicleProfileOrNotFound(vehicleId),
    getWorkOrderSupplierCatalog(),
  ]);
  const { vehicle, customer } = profile;

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <Link
          href={`/vehicles/${vehicle.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-hover"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
          Volver al vehículo
        </Link>

        <p className="mt-6 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
          Nueva orden
        </p>

        <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
          Crear orden de trabajo
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Cargá el problema, mano de obra y repuestos. Si seleccionás proveedor,
          el costo del repuesto alimenta la deuda del proveedor y el margen de la
          orden.
        </p>
      </header>

      <CreateWorkOrderForm
        vehicle={{
          id: vehicle.id,
          licensePlate: vehicle.licensePlate,
          brand: vehicle.brand,
          model: vehicle.model,
          customerName: customer.fullName,
          customerPhone: customer.phone,
        }}
        supplierCatalog={supplierCatalog}
      />
    </section>
  );
}

/**
 * Normalizes a Next.js search param into a single string.
 */
function normalizeSearchParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return (value[0] ?? "").trim();
  }

  return (value ?? "").trim();
}

/**
 * Resolves the vehicle profile and maps backend 404 responses to notFound().
 */
async function getVehicleProfileOrNotFound(id: string): Promise<VehicleProfile> {
  try {
    return await getVehicleProfile(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
