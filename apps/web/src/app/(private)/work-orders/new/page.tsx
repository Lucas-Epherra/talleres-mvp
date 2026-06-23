import { ArrowLeft, CarFront, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ApiError } from "../../../../lib/api";
import { formatDate } from "../../../../lib/format";
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
    return <MissingVehicleState />;
  }

  const vehicleProfile = await getVehicleProfileOrNotFound(vehicleId);

  if (vehicleProfile.vehicle.archivedAt) {
    return <ArchivedVehicleState vehicleProfile={vehicleProfile} />;
  }

  return (
    <section>
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div className="relative">
          <Link
            href={`/vehicles/${vehicleProfile.vehicle.id}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-hover"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
            Volver a la ficha del vehículo
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
 * Shows a safe state when the new order flow has no selected vehicle.
 */
function MissingVehicleState() {
  return (
    <section className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
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
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover"
        >
          <CarFront className="size-4 shrink-0" aria-hidden="true" />
          Ir a vehículos
        </Link>
      </div>
    </section>
  );
}

type ArchivedVehicleStateProps = {
  vehicleProfile: VehicleProfile;
};

/**
 * Blocks manual access to the new order route for archived vehicles.
 */
function ArchivedVehicleState({ vehicleProfile }: ArchivedVehicleStateProps) {
  const { vehicle, customer } = vehicleProfile;

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div className="relative">
          <Link
            href={`/vehicles/${vehicle.id}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-hover"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
            Volver a la ficha del vehículo
          </Link>

          <p className="mt-6 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Vehículo archivado
          </p>

          <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
            No se puede crear una orden
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            El vehículo {vehicle.licensePlate} está archivado y quedó fuera del
            flujo operativo. Para crear nuevas órdenes, primero restauralo desde
            su ficha.
          </p>
        </div>
      </header>

      <section
        aria-labelledby="archived-vehicle-lock-heading"
        className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3"
      >
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted text-muted-foreground">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Protección operativa
            </p>

            <h2
              id="archived-vehicle-lock-heading"
              className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
            >
              Vehículo fuera del flujo activo
            </h2>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ReadOnlyLockDetail
                label="Patente"
                value={vehicle.licensePlate}
              />
              <ReadOnlyLockDetail
                label="Vehículo"
                value={`${vehicle.brand} ${vehicle.model}`}
              />
              <ReadOnlyLockDetail label="Cliente" value={customer.fullName} />
              <ReadOnlyLockDetail
                label="Archivado el"
                value={formatDate(vehicle.archivedAt)}
              />
            </div>

            {vehicle.archivedReason ? (
              <p className="mt-4 rounded-2xl border border-border bg-surface-muted/85 px-4 py-3 text-sm leading-6 text-muted-foreground">
                Motivo de archivado:{" "}
                <span className="font-semibold text-foreground">
                  {vehicle.archivedReason}
                </span>
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={`/vehicles/${vehicle.id}`}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover sm:w-auto"
              >
                Ver ficha del vehículo
              </Link>

              <Link
                href="/vehicles?archiveStatus=archived"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated sm:w-auto"
              >
                Ver archivados
              </Link>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

type ReadOnlyLockDetailProps = {
  label: string;
  value: string;
};

/**
 * Small read-only detail block for route-level lock screens.
 */
function ReadOnlyLockDetail({ label, value }: ReadOnlyLockDetailProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/85 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">
        {label}
      </p>

      <p className="mt-2 wrap-anywhere text-sm font-bold leading-5 text-foreground">
        {value}
      </p>
    </div>
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
