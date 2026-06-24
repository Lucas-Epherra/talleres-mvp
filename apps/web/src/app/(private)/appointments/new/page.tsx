import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CreateAppointmentForm } from "../../../../features/appointments/components/CreateAppointmentForm";
import { getCustomers } from "../../../../features/customers/customers.server";
import { getVehicles } from "../../../../features/vehicles/vehicles.server";
import { getWorkOrders } from "../../../../features/work-orders/work-orders.server";

export const metadata: Metadata = {
  title: "Nuevo turno",
};

/**
 * Appointment creation page.
 *
 * Loads active customers, active vehicles and work orders server-side so the
 * client form can link agenda planning with operational records without
 * fetching from the browser.
 */
export default async function NewAppointmentPage() {
  const [customers, vehicles, workOrders] = await Promise.all([
    getCustomers({
      archiveStatus: "active",
    }),
    getVehicles({
      archiveStatus: "active",
    }),
    getWorkOrders(),
  ]);

  return (
    <section className="space-y-8">
      <header className="rounded-[1.35rem] border border-border bg-surface/85 p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <Link
          href="/appointments"
          className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-hover"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
          Volver a agenda
        </Link>

        <p className="mt-6 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
          Agenda
        </p>

        <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
          Crear turno
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Programá una visita, reparación, seguimiento o entrega. Si el turno
          corresponde a una orden existente, vinculalo para mantener la agenda
          conectada con el trabajo real.
        </p>
      </header>

      <CreateAppointmentForm
        customers={customers}
        vehicles={vehicles}
        workOrders={workOrders}
      />
    </section>
  );
}