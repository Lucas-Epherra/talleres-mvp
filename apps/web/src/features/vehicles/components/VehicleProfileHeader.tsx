import Link from "next/link";
import {
  formatMileage,
  formatWorkOrderStatus,
} from "../../../lib/format";
import type { VehicleProfile } from "../types";

type VehicleProfileHeaderProps = {
  profile: VehicleProfile;
};

/**
 * Header section for the vehicle profile screen.
 */
export function VehicleProfileHeader({ profile }: VehicleProfileHeaderProps) {
  const { vehicle, customer, currentStatus, summary } = profile;

  return (
    <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/vehicles"
            className="text-sm font-medium text-orange-300 transition hover:text-orange-200"
          >
            ← Volver a vehículos
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">
            Ficha del vehículo
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {vehicle.licensePlate}
          </h1>

          <p className="mt-3 text-lg text-slate-300">
            {vehicle.brand} {vehicle.model}
            {vehicle.year ? ` · ${vehicle.year}` : ""}
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Último kilometraje conocido: {formatMileage(vehicle.mileage)}
          </p>
        </div>

        <div className="flex flex-col gap-4 lg:min-w-115">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric
              label="Estado actual"
              value={formatWorkOrderStatus(currentStatus)}
            />
            <Metric label="Órdenes activas" value={summary.activeWorkOrders} />
            <Metric label="Historial" value={summary.deliveredWorkOrders} />
          </div>

          <Link
            href={`/work-orders/new?vehicleId=${vehicle.id}`}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-400"
          >
            Nueva orden de trabajo
          </Link>
        </div>
      </div>

      <section
        aria-labelledby="customer-heading"
        className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
      >
        <h2 id="customer-heading" className="text-sm font-semibold text-white">
          Cliente asociado
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <InfoItem label="Nombre" value={customer.fullName} />
          <InfoItem label="Teléfono" value={customer.phone ?? "Sin teléfono"} />
          <InfoItem label="Email" value={customer.email ?? "Sin email"} />
        </div>

        {customer.address || customer.notes ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <InfoItem
              label="Dirección"
              value={customer.address ?? "Sin dirección"}
            />
            <InfoItem label="Notas" value={customer.notes ?? "Sin notas"} />
          </div>
        ) : null}
      </section>
    </header>
  );
}

type MetricProps = {
  label: string;
  value: string | number;
};

/**
 * Small metric used in the vehicle profile header.
 */
function Metric({ label, value }: MetricProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </article>
  );
}

type InfoItemProps = {
  label: string;
  value: string;
};

/**
 * Displays a label/value pair for profile metadata.
 */
function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}