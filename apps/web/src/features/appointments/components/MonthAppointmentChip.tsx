import Link from "next/link";
import type { Appointment, AppointmentStatus } from "../types";

type MonthAppointmentChipProps = {
  appointment: Appointment;
};

/**
 * Minimal monthly-calendar preview for one appointment.
 *
 * Monthly cells must stay scannable even when a workshop has many turns.
 * This chip intentionally shows only time, title and a subtle status marker.
 * The full context remains available through the link target and accessible
 * labels.
 */
export function MonthAppointmentChip({ appointment }: MonthAppointmentChipProps) {
  const href = getAppointmentContextHref(appointment);
  const status = getStatusTreatment(appointment.status);
  const ariaLabel = buildAppointmentAriaLabel(appointment);

  const content = (
    <>
      <span
        className={buildClassName("size-2 shrink-0 rounded-full", status.dot)}
        aria-hidden="true"
      />

      <span className="shrink-0 text-[0.68rem] font-black text-foreground">
        {formatAppointmentStartTime(appointment.scheduledStart)}
      </span>

      <span className="min-w-0 flex-1 truncate text-[0.68rem] font-bold text-foreground">
        {appointment.title}
      </span>

      <span className="sr-only">{status.label}</span>
    </>
  );

  const className = buildClassName(
    "flex min-h-8 w-full min-w-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
    status.surface,
  );

  if (!href) {
    return (
      <div className={className} title={ariaLabel} aria-label={ariaLabel}>
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className={className} title={ariaLabel} aria-label={ariaLabel}>
      {content}
    </Link>
  );
}

type StatusTreatment = {
  label: string;
  dot: string;
  surface: string;
};

/**
 * Maps appointment status to compact, low-noise monthly calendar colors.
 */
function getStatusTreatment(status: AppointmentStatus): StatusTreatment {
  if (status === "CONFIRMED") {
    return {
      label: "Confirmado",
      dot: "bg-primary",
      surface:
        "border-primary/25 bg-primary/8 hover:border-primary/45 hover:bg-primary/12",
    };
  }

  if (status === "COMPLETED") {
    return {
      label: "Completado",
      dot: "bg-foreground/70",
      surface:
        "border-border bg-surface-elevated/85 hover:border-border-strong hover:bg-surface",
    };
  }

  if (status === "CANCELLED") {
    return {
      label: "Cancelado",
      dot: "bg-muted-foreground/55",
      surface:
        "border-border bg-surface-muted/75 text-muted-foreground hover:border-border-strong",
    };
  }

  return {
    label: "Programado",
    dot: "bg-warning",
    surface:
      "border-warning/25 bg-warning/8 hover:border-warning/45 hover:bg-warning/12",
  };
}

/**
 * Returns the most useful context link for an appointment.
 */
function getAppointmentContextHref(appointment: Appointment): string | null {
  if (appointment.workOrder) {
    return `/work-orders/${appointment.workOrder.id}`;
  }

  if (appointment.vehicle) {
    return `/vehicles/${appointment.vehicle.id}`;
  }

  if (appointment.customer) {
    return `/customers/${appointment.customer.id}`;
  }

  return null;
}

/**
 * Builds a descriptive label with hidden details for assistive technologies.
 */
function buildAppointmentAriaLabel(appointment: Appointment): string {
  const parts = [
    `${formatAppointmentStartTime(appointment.scheduledStart)} ${appointment.title}`,
    `Estado: ${getStatusTreatment(appointment.status).label}`,
  ];

  if (appointment.customer) {
    parts.push(`Cliente: ${appointment.customer.fullName}`);
  }

  if (appointment.vehicle) {
    parts.push(
      `Vehículo: ${appointment.vehicle.licensePlate}, ${appointment.vehicle.brand} ${appointment.vehicle.model}`,
    );
  }

  if (appointment.workOrder) {
    parts.push(`Orden: #${appointment.workOrder.orderNumber}`);
  }

  return parts.join(". ");
}

/**
 * Formats only the appointment start time for monthly chips.
 */
function formatAppointmentStartTime(start: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(start));
}

/**
 * Joins class names while ignoring empty values.
 */
function buildClassName(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
