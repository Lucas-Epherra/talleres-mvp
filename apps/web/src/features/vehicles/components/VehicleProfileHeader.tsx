import Link from "next/link";
import { formatMileage, formatWorkOrderStatus } from "../../../lib/format";
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

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href={`/work-orders/new?vehicleId=${vehicle.id}`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-400"
            >
              Nueva orden
            </Link>

            <Link
              href={`/vehicles/${vehicle.id}/edit`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-100 transition hover:border-orange-400 hover:text-orange-300"
            >
              Editar vehículo
            </Link>
          </div>
        </div>
      </div>

<section
  aria-labelledby="vehicle-data-heading"
  className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/70"
>
  <div className="border-b border-slate-800 p-5">
    <h2
      id="vehicle-data-heading"
      className="text-sm font-semibold text-white"
    >
      Datos del vehículo
    </h2>
  </div>

  <dl className="divide-y divide-slate-800">
    <SheetRow label="Patente" value={vehicle.licensePlate} />
    <SheetRow label="Marca" value={vehicle.brand} />
    <SheetRow label="Modelo" value={vehicle.model} />
    <SheetRow
      label="Año"
      value={vehicle.year ? vehicle.year.toString() : "Sin cargar"}
    />
    <SheetRow label="Kilometraje" value={formatMileage(vehicle.mileage)} />
    <SheetRow label="Notas" value={vehicle.notes ?? "Sin notas"} />
  </dl>
</section>

      <section
        aria-labelledby="customer-heading"
        className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/70"
      >
        <div className="flex flex-col gap-3 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="customer-heading" className="text-sm font-semibold text-white">
            Cliente asociado
          </h2>

          <Link
            href={`/customers/${vehicle.customerId}`}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300 transition hover:text-orange-200"
          >
            Ver cliente
          </Link>
        </div>

        <dl className="divide-y divide-slate-800">
          <SheetRow label="Nombre" value={customer.fullName} />
          <SheetRow label="Teléfono" value={customer.phone ?? "Sin teléfono"} />
          <SheetRow label="Email" value={customer.email ?? "Sin email"} />
          <SheetRow
            label="Dirección"
            value={customer.address ?? "Sin dirección"}
          />
          <SheetRow label="Notas" value={customer.notes ?? "Sin notas"} />
        </dl>
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

type SheetRowProps = {
  label: string;
  value: string;
};

/**
 * Spreadsheet-like row for customer metadata inside the vehicle profile.
 */
function SheetRow({ label, value }: SheetRowProps) {
  return (
    <div className="grid md:grid-cols-[12rem_1fr]">
      <dt className="border-slate-800 bg-slate-900/60 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 md:border-r">
        {label}
      </dt>

      <dd className="wrap-break-word px-4 py-3 text-sm font-medium leading-6 text-slate-100">
        {value}
      </dd>
    </div>
  );
}