import {
  CalendarClock,
  CarFront,
  ClipboardList,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AppointmentActions } from "./AppointmentActions";
import {
  AppointmentStatusBadge,
  formatAppointmentStatus,
} from "./AppointmentStatusBadge";
import type { Appointment } from "../types";

type AppointmentCardProps = {
  appointment: Appointment;
};

/**
 * Mobile-first card for one agenda appointment.
 */
export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const isCancelled = appointment.status === "CANCELLED";

  return (
    <article
      className={
        isCancelled
          ? "rounded-[1.1rem] border border-border bg-surface-muted/80 p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:rounded-[1.35rem] sm:p-5"
          : "rounded-[1.1rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 transition hover:border-primary/40 sm:rounded-[1.35rem] sm:p-5"
      }
    >
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
              {formatAppointmentTimeRange(
                appointment.scheduledStart,
                appointment.scheduledEnd,
              )}
            </p>

            <h2 className="mt-2 wrap-anywhere font-display text-lg font-black uppercase tracking-[0.04em] text-foreground">
              {appointment.title}
            </h2>

            {appointment.description ? (
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {appointment.description}
              </p>
            ) : null}
          </div>

          <AppointmentStatusBadge status={appointment.status} />
        </header>

        <dl className="grid gap-3 sm:grid-cols-3">
          <AppointmentDatum
            icon={<UserRound className="size-4" aria-hidden="true" />}
            label="Cliente"
            value={appointment.customer?.fullName ?? "Sin cliente"}
            detail={appointment.customer?.phone ?? undefined}
            href={
              appointment.customer
                ? `/customers/${appointment.customer.id}`
                : undefined
            }
          />

          <AppointmentDatum
            icon={<CarFront className="size-4" aria-hidden="true" />}
            label="Vehículo"
            value={
              appointment.vehicle
                ? `${appointment.vehicle.brand} ${appointment.vehicle.model}`
                : "Sin vehículo"
            }
            detail={appointment.vehicle?.licensePlate}
            href={
              appointment.vehicle
                ? `/vehicles/${appointment.vehicle.id}`
                : undefined
            }
          />

          <AppointmentDatum
            icon={<ClipboardList className="size-4" aria-hidden="true" />}
            label="Orden"
            value={
              appointment.workOrder
                ? `#${appointment.workOrder.orderNumber}`
                : "Sin orden"
            }
            detail={appointment.workOrder?.status}
            href={
              appointment.workOrder
                ? `/work-orders/${appointment.workOrder.id}`
                : undefined
            }
          />
        </dl>

        {appointment.status === "CANCELLED" && appointment.cancellationReason ? (
          <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-6 text-muted-foreground">
            Motivo de cancelación:{" "}
            <span className="font-semibold text-foreground">
              {appointment.cancellationReason}
            </span>
          </p>
        ) : null}

        <AppointmentActions
          appointmentId={appointment.id}
          status={appointment.status}
        />

        <p className="sr-only">
          Estado del turno: {formatAppointmentStatus(appointment.status)}
        </p>
      </div>
    </article>
  );
}

type AppointmentDatumProps = {
  icon: ReactNode;
  label: string;
  value: string;
  detail?: string;
  href?: string;
};

/**
 * Small read-only appointment relation datum.
 */
function AppointmentDatum({
  icon,
  label,
  value,
  detail,
  href,
}: AppointmentDatumProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/85 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition hover:border-border-strong">
      <dt className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">
        {icon}
        {label}
      </dt>

      <dd className="mt-2 wrap-anywhere text-sm font-bold leading-5 text-foreground">
        {href ? (
          <Link
            href={href}
            className="underline decoration-transparent underline-offset-4 transition hover:text-primary hover:decoration-primary"
          >
            {value}
          </Link>
        ) : (
          value
        )}
      </dd>

      {detail ? (
        <dd className="mt-1 wrap-anywhere text-xs font-semibold text-muted-foreground">
          {detail}
        </dd>
      ) : null}
    </div>
  );
}

/**
 * Formats the appointment start and end times for compact agenda cards.
 */
function formatAppointmentTimeRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  return `${formatDateTime(startDate)} - ${formatTime(endDate)}`;
}

/**
 * Formats date and time in Spanish for agenda cards.
 */
function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

/**
 * Formats only the time part.
 */
function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeStyle: "short",
  }).format(date);
}