import Link from "next/link";
import type { Metadata } from "next";
import { CreateWorkOrderForm } from "../../../../features/work-orders/components/CreateWorkOrderForm";

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
 * This first MVP flow expects vehicleId from the vehicle profile:
 * /work-orders/new?vehicleId=VEHICLE_ID
 */
export default async function NewWorkOrderPage({
  searchParams,
}: NewWorkOrderPageProps) {
  const resolvedSearchParams = await searchParams;
  const vehicleId = getSingleSearchParamValue(resolvedSearchParams.vehicleId);

  if (!vehicleId) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">
          Nueva orden
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Falta seleccionar un vehículo
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Para crear una orden de trabajo en este flujo, primero entrá a la
          ficha de un vehículo y usá la acción “Nueva orden de trabajo”.
        </p>

        <Link
          href="/vehicles"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-400"
        >
          Ir a vehículos
        </Link>
      </section>
    );
  }

  return (
    <section>
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
        <Link
          href={`/vehicles/${vehicleId}`}
          className="text-sm font-medium text-orange-300 transition hover:text-orange-200"
        >
          ← Volver a la ficha del vehículo
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">
          Nueva orden
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Crear orden de trabajo
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Registrá el problema reportado, kilometraje de ingreso, diagnóstico,
          trabajos, repuestos y costos asociados a este vehículo.
        </p>
      </div>

      <CreateWorkOrderForm vehicleId={vehicleId} />
    </section>
  );
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