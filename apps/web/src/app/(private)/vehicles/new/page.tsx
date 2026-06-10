import type { Metadata } from "next";
import Link from "next/link";
import { CreateVehicleForm } from "../../../../features/vehicles/components/CreateVehicleForm";
import { getCustomers } from "../../../../features/customers/customers.server";

export const metadata: Metadata = {
  title: "Nuevo vehículo",
};

/**
 * Vehicle creation page.
 *
 * Loads customers server-side so the interactive vehicle form can associate
 * the new vehicle with an existing customer.
 */
export default async function NewVehiclePage() {
  const customers = await getCustomers();

  return (
    <section className="space-y-8">
      <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
        <Link
          href="/vehicles"
          className="text-sm font-medium text-orange-300 transition hover:text-orange-200"
        >
          ← Volver a vehículos
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">
          Nuevo vehículo
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Crear vehículo
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Asociá un vehículo a un cliente existente para comenzar a construir su
          ficha operativa.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
        <CreateVehicleForm customers={customers} />
      </section>
    </section>
  );
}