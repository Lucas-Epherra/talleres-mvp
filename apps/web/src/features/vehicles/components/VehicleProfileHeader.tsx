import Link from "next/link";
import { formatMileage, formatWorkOrderStatus } from "../../../lib/format";
import type { VehicleProfile } from "../types";
import {
  DetailSheet,
  DetailSheetRow,
} from "../../../components/ui/DetailSheet";


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
      <DetailSheet
        headingId="vehicle-data-heading"
        title="Datos del vehículo"
        className="mt-8"
        titleSize="sm"
      >
        <DetailSheetRow label="Patente" value={vehicle.licensePlate} />
        <DetailSheetRow label="Marca" value={vehicle.brand} />
        <DetailSheetRow label="Modelo" value={vehicle.model} />
        <DetailSheetRow
          label="Año"
          value={vehicle.year ? vehicle.year.toString() : "Sin cargar"}
        />
        <DetailSheetRow label="Kilometraje" value={formatMileage(vehicle.mileage)} />
        <DetailSheetRow label="Notas" value={vehicle.notes ?? "Sin notas"} />
      </DetailSheet>

      <DetailSheet
        headingId="customer-heading"
        title="Cliente asociado"
        className="mt-8"
        titleSize="sm"
        action={
          <Link
            href={`/customers/${vehicle.customerId}`}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300 transition hover:text-orange-200"
          >
            Ver cliente
          </Link>
        }
      >
        <DetailSheetRow label="Nombre" value={customer.fullName} />
        <DetailSheetRow label="Teléfono" value={customer.phone ?? "Sin teléfono"} />
        <DetailSheetRow label="Email" value={customer.email ?? "Sin email"} />
        <DetailSheetRow
          label="Dirección"
          value={customer.address ?? "Sin dirección"}
        />
        <DetailSheetRow label="Notas" value={customer.notes ?? "Sin notas"} />
      </DetailSheet>
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
