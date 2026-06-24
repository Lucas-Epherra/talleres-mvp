import type { AppointmentStatus } from "../types";

type AppointmentStatusBadgeProps = {
  status: AppointmentStatus;
};

/**
 * Compact visual label for appointment status.
 */
export function AppointmentStatusBadge({
  status,
}: AppointmentStatusBadgeProps) {
  return (
    <span className={getStatusClassName(status)}>
      {formatAppointmentStatus(status)}
    </span>
  );
}

/**
 * Maps appointment status values to readable Spanish labels.
 */
export function formatAppointmentStatus(status: AppointmentStatus): string {
  const labels: Record<AppointmentStatus, string> = {
    SCHEDULED: "Programado",
    CONFIRMED: "Confirmado",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
  };

  return labels[status];
}

/**
 * Returns the visual treatment for each status.
 */
function getStatusClassName(status: AppointmentStatus): string {
  const baseClassName =
    "inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.16em]";

  if (status === "CONFIRMED") {
    return `${baseClassName} border-primary/40 bg-primary/10 text-primary`;
  }

  if (status === "COMPLETED") {
    return `${baseClassName} border-border-strong bg-surface-muted text-foreground`;
  }

  if (status === "CANCELLED") {
    return `${baseClassName} border-border bg-surface-muted text-muted-foreground`;
  }

  return `${baseClassName} border-warning/40 bg-warning/10 text-warning`;
}
