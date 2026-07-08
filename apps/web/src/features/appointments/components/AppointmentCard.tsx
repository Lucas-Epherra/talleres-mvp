import {
  AlertTriangle,
  CalendarClock,
  CarFront,
  ClipboardList,
  Clock3,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatWorkOrderStatus } from "../../../lib/format";
import { AppointmentActions } from "./AppointmentActions";
import {
  AppointmentStatusBadge,
  formatAppointmentStatus,
} from "./AppointmentStatusBadge";
import type { Appointment } from "../types";

type AppointmentCardProps = {
  appointment: Appointment;
};

type TimingState = "overdue" | "today" | "tomorrow" | "upcoming" | "closed";

/**
 * Mobile-first card for one agenda appointment.
 *
 * The card prioritizes the daily workshop scan: time, status, linked customer,
 * vehicle, order and the few actions needed to move the appointment forward.
 */
export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const timingState = getTimingState(appointment);
  const isCancelled = appointment.status === "CANCELLED";
  const isOverdue = timingState === "overdue";

  return (
    <article
      className={getArticleClassName({
        isCancelled,
        isOverdue,
      })}
    >
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <p className="inline-flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
                {formatAppointmentTimeRange(
                  appointment.scheduledStart,
                  appointment.scheduledEnd,
                )}
              </p>

              <TimingBadge state={timingState} />
            </div>

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

        <dl className="grid gap-3 lg:grid-cols-3">
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
            detail={
              appointment.workOrder
                ? formatWorkOrderStatus(appointment.workOrder.status)
                : undefined
            }
            href={
              appointment.workOrder
                ? `/work-orders/${appointment.workOrder.id}`
                : undefined
            }
          />
        </dl>

        {isOverdue ? (
          <p className="flex items-start gap-2 rounded-2xl border border-warning/45 bg-warning/10 px-4 py-3 text-sm font-semibold leading-6 text-foreground">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-warning"
              aria-hidden="true"
            />
            Este turno ya pasó y todavía está pendiente o confirmado. Conviene
            completarlo, cancelarlo o reprogramarlo desde una nueva carga.
          </p>
        ) : null}

        {appointment.status === "CANCELLED" && appointment.cancellationReason ? (
          <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-6 text-muted-foreground">
            Motivo de cancelación: {" "}
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

type TimingBadgeProps = {
  state: TimingState;
};

/**
 * Displays the appointment timing state beside the scheduled time.
 */
function TimingBadge({ state }: TimingBadgeProps) {
  const labelByState: Record<TimingState, string> = {
    overdue: "Atrasado",
    today: "Hoy",
    tomorrow: "Mañana",
    upcoming: "Próximo",
    closed: "Cerrado",
  };

  const baseClassName =
    "inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.16em]";

  if (state === "overdue") {
    return (
      <span className={`${baseClassName} border-warning/45 bg-warning/10 text-warning`}>
        <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
        {labelByState[state]}
      </span>
    );
  }

  if (state === "closed") {
    return (
      <span className={`${baseClassName} border-border bg-surface-muted text-muted-foreground`}>
        <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
        {labelByState[state]}
      </span>
    );
  }

  return (
    <span className={`${baseClassName} border-primary/35 bg-primary/10 text-primary`}>
      <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
      {labelByState[state]}
    </span>
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

/**
 * Returns the visual surface for each agenda card state.
 */
function getArticleClassName({
  isCancelled,
  isOverdue,
}: {
  isCancelled: boolean;
  isOverdue: boolean;
}): string {
  const baseClassName =
    "rounded-[1.1rem] border p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:rounded-[1.35rem] sm:p-5";

  if (isCancelled) {
    return `${baseClassName} border-border bg-surface-muted/80`;
  }

  if (isOverdue) {
    return `${baseClassName} border-warning/45 bg-linear-to-br from-warning/10 via-surface to-surface-elevated transition hover:border-warning`;
  }

  return `${baseClassName} border-border bg-linear-to-br from-surface via-surface to-surface-elevated transition hover:border-primary/40`;
}

/**
 * Returns the current timing state used by the card.
 */
function getTimingState(appointment: Appointment): TimingState {
  if (appointment.status === "COMPLETED" || appointment.status === "CANCELLED") {
    return "closed";
  }

  const now = new Date();
  const scheduledStart = new Date(appointment.scheduledStart);
  const scheduledEnd = new Date(appointment.scheduledEnd);

  if (scheduledEnd < now) {
    return "overdue";
  }

  if (isSameCalendarDay(scheduledStart, now)) {
    return "today";
  }

  if (isSameCalendarDay(scheduledStart, addDays(now, 1))) {
    return "tomorrow";
  }

  return "upcoming";
}

/**
 * Compares two dates by calendar day.
 */
function isSameCalendarDay(firstDate: Date, secondDate: Date): boolean {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

/**
 * Adds days to a date without mutating the original value.
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);

  return result;
}
