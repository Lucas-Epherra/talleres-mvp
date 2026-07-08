import { CalendarDays, CarFront, ClipboardList, Clock3, UserRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatWorkOrderStatus } from "../../../lib/format";
import { AppointmentActions } from "./AppointmentActions";
import { AppointmentStatusBadge } from "./AppointmentStatusBadge";
import type {
  Appointment,
  AppointmentCalendarSummary,
} from "../types";

type CalendarWeekViewProps = {
  appointments: Appointment[];
  rangeStart: string;
  rangeEnd: string;
  summary: AppointmentCalendarSummary;
  hasFilters: boolean;
};

/**
 * Responsive calendar-style agenda view.
 *
 * Desktop renders one column per visible day. Mobile keeps the same calendar
 * grouping but stacks days vertically, which is easier to use in a workshop.
 */
export function CalendarWeekView({
  appointments,
  rangeStart,
  rangeEnd,
  summary,
  hasFilters,
}: CalendarWeekViewProps) {
  const days = buildCalendarDays(rangeStart, rangeEnd);

  return (
    <section
      aria-labelledby="agenda-calendar-heading"
      className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-5"
    >
      <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted text-primary">
            <CalendarDays className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              Calendario
            </p>

            <h2
              id="agenda-calendar-heading"
              className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
            >
              Vista por día
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {hasFilters
                ? "Vista filtrada por día. Aunque no haya resultados, el calendario queda visible para revisar disponibilidad."
                : "Turnos organizados por día. La agenda se mantiene visible aunque no haya turnos, así podés revisar disponibilidad y carga diaria."}
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[28rem] xl:grid-cols-4">
          <CalendarSummaryPill
            label="Turnos"
            value={summary.totalAppointments}
          />
          <CalendarSummaryPill
            label="Por atender"
            value={summary.operationalAppointments}
          />
          <CalendarSummaryPill
            label="Atrasados"
            value={summary.overdueAppointments}
            tone={summary.overdueAppointments > 0 ? "warning" : "neutral"}
          />
          <CalendarSummaryPill label="Con orden" value={summary.linkedWorkOrders} />
        </div>
      </header>

      <div className="mt-5 overflow-x-auto pb-2">
        <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-flow-col xl:auto-cols-[minmax(16rem,1fr)] xl:grid-cols-none xl:items-start">
          {days.map((day) => (
            <CalendarDayColumn
              key={day.key}
              day={day}
              appointments={getAppointmentsForDay(appointments, day.date)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

type CalendarSummaryPillProps = {
  label: string;
  value: number;
  tone?: "neutral" | "warning";
};

/**
 * Compact metric used inside the calendar header.
 */
function CalendarSummaryPill({
  label,
  value,
  tone = "neutral",
}: CalendarSummaryPillProps) {
  return (
    <div
      className={
        tone === "warning"
          ? "rounded-2xl border border-warning/45 bg-warning/10 px-3 py-2"
          : "rounded-2xl border border-border bg-surface-muted/85 px-3 py-2"
      }
    >
      <p
        className={
          tone === "warning"
            ? "text-[0.62rem] font-bold uppercase tracking-[0.16em] text-warning"
            : "text-[0.62rem] font-bold uppercase tracking-[0.16em] text-primary"
        }
      >
        {label}
      </p>
      <p className="mt-1 font-display text-lg font-black text-foreground">
        {value}
      </p>
    </div>
  );
}

type CalendarDay = {
  key: string;
  date: Date;
};

type CalendarDayColumnProps = {
  day: CalendarDay;
  appointments: Appointment[];
};

/**
 * One day column inside the calendar.
 */
function CalendarDayColumn({ day, appointments }: CalendarDayColumnProps) {
  const isToday = isSameCalendarDay(day.date, new Date());

  return (
    <section
      aria-labelledby={`agenda-day-${day.key}`}
      className={
        isToday
          ? "h-fit min-w-0 rounded-2xl border border-primary/40 bg-primary/10 p-3 ring-1 ring-white/3 xl:min-w-64"
          : "h-fit min-w-0 rounded-2xl border border-border bg-surface-muted/70 p-3 ring-1 ring-white/3 xl:min-w-64"
      }
    >
      <header className="border-b border-border pb-3">
        <p
          className={
            isToday
              ? "text-[0.62rem] font-black uppercase tracking-[0.18em] text-primary"
              : "text-[0.62rem] font-black uppercase tracking-[0.18em] text-muted-foreground"
          }
        >
          {isToday ? "Hoy" : formatWeekday(day.date)}
        </p>

        <h3
          id={`agenda-day-${day.key}`}
          className="mt-1 font-display text-base font-black uppercase tracking-[0.03em] text-foreground"
        >
          {formatDayTitle(day.date)}
        </h3>

        <p className="mt-1 text-xs font-semibold text-muted-foreground">
          {appointments.length} turno{appointments.length === 1 ? "" : "s"}
        </p>
      </header>

      {appointments.length > 0 ? (
        <div className="mt-3 space-y-3">
          {appointments.map((appointment) => (
            <AppointmentCalendarCard
              key={appointment.id}
              appointment={appointment}
            />
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-border bg-surface/80 px-3 py-3 text-center">
          <p className="text-xs font-semibold text-muted-foreground">
            Día libre
          </p>
          <Link
            href="/appointments/new"
            className="mt-2 inline-flex text-[0.68rem] font-black uppercase tracking-[0.14em] text-primary transition hover:text-primary-hover"
          >
            Nuevo turno
          </Link>
        </div>
      )}
    </section>
  );
}

type AppointmentCalendarCardProps = {
  appointment: Appointment;
};

/**
 * Compact appointment card optimized for calendar columns.
 */
function AppointmentCalendarCard({ appointment }: AppointmentCalendarCardProps) {
  const isOverdue = isOverdueOperationalAppointment(appointment);

  return (
    <article
      className={
        isOverdue
          ? "rounded-2xl border border-warning/45 bg-warning/10 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.64)]"
          : "rounded-2xl border border-border bg-surface p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.64)] transition hover:border-primary/40"
      }
    >
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p
            className={
              isOverdue
                ? "inline-flex items-center gap-1 text-xs font-black text-warning"
                : "inline-flex items-center gap-1 text-xs font-black text-primary"
            }
          >
            <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
            {formatTimeRange(
              appointment.scheduledStart,
              appointment.scheduledEnd,
            )}
          </p>

          <AppointmentStatusBadge status={appointment.status} />
        </div>

        <h4 className="wrap-anywhere text-sm font-black leading-5 text-foreground">
          {appointment.title}
        </h4>

        {isOverdue ? (
          <p className="text-xs font-bold text-warning">Turno atrasado</p>
        ) : null}
      </header>

      {appointment.description ? (
        <p className="mt-2 whitespace-pre-line text-xs leading-5 text-muted-foreground">
          {appointment.description}
        </p>
      ) : null}

      <dl className="mt-3 grid gap-2">
        <CalendarRelationDatum
          icon={<UserRound className="size-3.5" aria-hidden="true" />}
          label="Cliente"
          value={appointment.customer?.fullName ?? "Sin cliente"}
          detail={appointment.customer?.phone ?? undefined}
          href={
            appointment.customer
              ? `/customers/${appointment.customer.id}`
              : undefined
          }
        />

        <CalendarRelationDatum
          icon={<CarFront className="size-3.5" aria-hidden="true" />}
          label="Vehículo"
          value={
            appointment.vehicle
              ? `${appointment.vehicle.licensePlate} · ${appointment.vehicle.brand} ${appointment.vehicle.model}`
              : "Sin vehículo"
          }
          href={
            appointment.vehicle
              ? `/vehicles/${appointment.vehicle.id}`
              : undefined
          }
        />

        <CalendarRelationDatum
          icon={<ClipboardList className="size-3.5" aria-hidden="true" />}
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

      {appointment.status === "CANCELLED" && appointment.cancellationReason ? (
        <p className="mt-3 rounded-xl border border-border bg-surface-muted/80 px-3 py-2 text-xs leading-5 text-muted-foreground">
          Motivo: {appointment.cancellationReason}
        </p>
      ) : null}

      <div className="mt-3">
        <AppointmentActions
          appointmentId={appointment.id}
          status={appointment.status}
          variant="compact"
        />
      </div>
    </article>
  );
}

type CalendarRelationDatumProps = {
  icon: ReactNode;
  label: string;
  value: string;
  detail?: string;
  href?: string;
};

/**
 * Compact relationship detail used by calendar cards.
 */
function CalendarRelationDatum({
  icon,
  label,
  value,
  detail,
  href,
}: CalendarRelationDatumProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted/80 px-3 py-2">
      <dt className="flex items-center gap-1.5 text-[0.58rem] font-black uppercase tracking-[0.16em] text-primary">
        {icon}
        {label}
      </dt>

      <dd className="mt-1 wrap-anywhere text-xs font-bold leading-5 text-foreground">
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
        <dd className="mt-0.5 wrap-anywhere text-[0.7rem] font-semibold text-muted-foreground">
          {detail}
        </dd>
      ) : null}
    </div>
  );
}

/**
 * Builds visible days from a [start, end) range.
 */
function buildCalendarDays(rangeStart: string, rangeEnd: string): CalendarDay[] {
  const start = startOfDay(new Date(rangeStart));
  const end = startOfDay(new Date(rangeEnd));
  const days: CalendarDay[] = [];

  for (let currentDate = start; currentDate < end; ) {
    const day = new Date(currentDate);
    days.push({
      key: day.toISOString().slice(0, 10),
      date: day,
    });

    currentDate = addDays(currentDate, 1);
  }

  return days.length > 0 ? days : [{ key: start.toISOString(), date: start }];
}

/**
 * Returns appointments scheduled for one calendar day.
 */
function getAppointmentsForDay(
  appointments: Appointment[],
  day: Date,
): Appointment[] {
  return appointments
    .filter((appointment) =>
      isSameCalendarDay(new Date(appointment.scheduledStart), day),
    )
    .sort((firstAppointment, secondAppointment) =>
      firstAppointment.scheduledStart.localeCompare(
        secondAppointment.scheduledStart,
      ),
    );
}

/**
 * Returns true when an appointment is still pending after its end time.
 */
function isOverdueOperationalAppointment(appointment: Appointment): boolean {
  return (
    (appointment.status === "SCHEDULED" ||
      appointment.status === "CONFIRMED") &&
    new Date(appointment.scheduledEnd) < new Date()
  );
}

/**
 * Formats the appointment time range.
 */
function formatTimeRange(start: string, end: string): string {
  const formatter = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${formatter.format(new Date(start))} - ${formatter.format(
    new Date(end),
  )}`;
}

/**
 * Formats weekday label.
 */
function formatWeekday(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
  }).format(date);
}

/**
 * Formats the day title.
 */
function formatDayTitle(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

/**
 * Returns the start of the provided day.
 */
function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  return result;
}

/**
 * Adds days to a date.
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);

  return result;
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
