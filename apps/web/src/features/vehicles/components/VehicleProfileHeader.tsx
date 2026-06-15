import Link from "next/link";
import {
  formatMileage,
  formatWorkOrderStatus,
  type WorkOrderStatus,
} from "../../../lib/format";
import {
  DetailSheet,
  DetailSheetRow,
} from "../../../components/ui/DetailSheet";
import type { VehicleProfile } from "../types";

type VehicleProfileHeaderProps = {
  profile: VehicleProfile;
};

/**
 * Header section for the vehicle profile screen.
 *
 * This is the main operational summary for a vehicle: identification, current
 * status, primary actions, vehicle data and associated customer data.
 */
export function VehicleProfileHeader({ profile }: VehicleProfileHeaderProps) {
  const { vehicle, customer, currentStatus, summary } = profile;

  return (
    <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-surface/85 p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
      <div
        aria-hidden="true"
        className="absolute right-0 top-0 h-56 w-56 translate-x-16 -translate-y-20 rounded-full bg-primary/15 blur-3xl"
      />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/vehicles"
            className="inline-flex text-sm font-bold text-primary transition hover:text-primary-hover"
          >
            ← Volver a vehículos
          </Link>

          <p className="mt-6 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Ficha del vehículo
          </p>

          <h1 className="mt-3 wrap-break-word font-display text-4xl font-black italic uppercase tracking-[-0.04em] text-white sm:text-5xl">
            {vehicle.licensePlate}
          </h1>

          <p className="mt-3 wrap-break-word text-lg font-semibold text-muted-foreground">
            {vehicle.brand} {vehicle.model}
            {vehicle.year ? ` · ${vehicle.year}` : ""}
          </p>

          <p className="mt-2 text-sm text-steel">
            Último kilometraje conocido: {formatMileage(vehicle.mileage)}
          </p>
        </div>

        <div className="flex flex-col gap-4 lg:min-w-md">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric
              label="Estado actual"
              value={formatWorkOrderStatus(currentStatus)}
              tone={getCurrentStatusTone(currentStatus)}
            />
            <Metric label="Órdenes activas" value={summary.activeWorkOrders} />
            <Metric label="Historial" value={summary.deliveredWorkOrders} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href={`/work-orders/new?vehicleId=${vehicle.id}`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-[0_14px_35px_rgba(214,40,40,0.22)] transition hover:bg-primary-hover"
            >
              Nueva orden
            </Link>

            <Link
              href={`/vehicles/${vehicle.id}/edit`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated"
            >
              Editar vehículo
            </Link>
          </div>
        </div>
      </div>

      <DetailSheet
        headingId="vehicle-data-heading"
        title="Datos del vehículo"
        className="relative mt-8"
        titleSize="sm"
      >
        <DetailSheetRow label="Patente" value={vehicle.licensePlate} />
        <DetailSheetRow label="Marca" value={vehicle.brand} />
        <DetailSheetRow label="Modelo" value={vehicle.model} />
        <DetailSheetRow
          label="Año"
          value={vehicle.year ? vehicle.year.toString() : "Sin cargar"}
        />
        <DetailSheetRow
          label="Kilometraje"
          value={formatMileage(vehicle.mileage)}
        />
        <DetailSheetRow
          label="Notas"
          value={<BreakableDetailValue value={vehicle.notes ?? "Sin notas"} />}
        />
      </DetailSheet>

      <DetailSheet
        headingId="customer-heading"
        title="Cliente asociado"
        className="relative mt-8"
        titleSize="sm"
        action={
          <Link
            href={`/customers/${vehicle.customerId}`}
            className="text-xs font-bold uppercase tracking-[0.14em] text-primary transition hover:text-primary-hover"
          >
            Ver cliente
          </Link>
        }
      >
        <DetailSheetRow label="Nombre" value={customer.fullName} />
        <DetailSheetRow
          label="Teléfono"
          value={customer.phone ?? "Sin teléfono"}
        />
        <DetailSheetRow
          label="Email"
          value={
            <BreakableDetailValue value={customer.email ?? "Sin email"} />
          }
        />
        <DetailSheetRow
          label="Dirección"
          value={
            <BreakableDetailValue
              value={customer.address ?? "Sin dirección"}
            />
          }
        />
        <DetailSheetRow
          label="Notas"
          value={<BreakableDetailValue value={customer.notes ?? "Sin notas"} />}
        />
      </DetailSheet>
    </header>
  );
}

type MetricProps = {
  label: string;
  value: string | number;
  tone?: "neutral" | "active" | "ready" | "closed";
};

/**
 * Small metric used in the vehicle profile header.
 */
function Metric({ label, value, tone = "neutral" }: MetricProps) {
  return (
    <article className={getMetricClassName(tone)}>
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 wrap-break-word font-display text-xl font-black uppercase tracking-[0.02em] text-white">
        {value}
      </p>
    </article>
  );
}

/**
 * Maps operational status into a visual metric tone.
 */
function getCurrentStatusTone(
  status: WorkOrderStatus | "NO_ACTIVE_WORK_ORDER",
): MetricProps["tone"] {
  if (status === "IN_PROGRESS") {
    return "active";
  }

  if (status === "READY") {
    return "ready";
  }

  if (status === "DELIVERED" || status === "NO_ACTIVE_WORK_ORDER") {
    return "closed";
  }

  return "neutral";
}

/**
 * Returns the visual classes for status metrics.
 */
function getMetricClassName(tone: MetricProps["tone"]): string {
  const baseClassName =
    "rounded-2xl border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

  if (tone === "active") {
    return `${baseClassName} border-primary/40 bg-primary/10`;
  }

  if (tone === "ready") {
    return `${baseClassName} border-warning/40 bg-warning/10`;
  }

  if (tone === "closed") {
    return `${baseClassName} border-border bg-background/55`;
  }

  return `${baseClassName} border-border bg-background/65`;
}

type BreakableDetailValueProps = {
  value: string;
};

/**
 * Prevents long vehicle/customer values from overflowing inside detail sheets.
 */
function BreakableDetailValue({ value }: BreakableDetailValueProps) {
  return (
    <span className="block min-w-0 max-w-full wrap-break-word">
      {value}
    </span>
  );
}