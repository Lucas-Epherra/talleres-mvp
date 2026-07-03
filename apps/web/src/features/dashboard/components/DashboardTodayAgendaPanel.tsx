import { CalendarDays } from "lucide-react";
import Link from "next/link";
import {
  formatAppointmentStatus,
  formatRelativeTime,
  formatTime,
} from "../utils";
import type { DashboardAppointment } from "../types";

type DashboardTodayAgendaPanelProps = {
  todayAppointments: DashboardAppointment[];
  upcomingAppointments: DashboardAppointment[];
};

/**
 * Shows today's agenda. When there are no appointments today, it keeps the
 * section compact and shows upcoming turns instead.
 */
export function DashboardTodayAgendaPanel({
  todayAppointments,
  upcomingAppointments,
}: DashboardTodayAgendaPanelProps) {
  const appointmentsToShow =
    todayAppointments.length > 0 ? todayAppointments : upcomingAppointments.slice(0, 4);
  const isShowingUpcoming = todayAppointments.length === 0;

  return (
    <section
      aria-labelledby="today-agenda-heading"
      className="overflow-hidden rounded-[1.35rem] border border-border bg-white/96 shadow-(--shadow-industrial) ring-1 ring-white/70"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted text-primary">
            <CalendarDays className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p className="text-[0.66rem] font-black uppercase tracking-[0.2em] text-primary">
              Agenda
            </p>

            <h2
              id="today-agenda-heading"
              className="mt-1.5 font-display text-lg font-black uppercase tracking-[0.035em] text-foreground"
            >
              {isShowingUpcoming ? "Próximos turnos" : "Turnos de hoy"}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {isShowingUpcoming
                ? "No hay turnos hoy. Estos son los próximos."
                : "Citas y entregas programadas para hoy."}
            </p>
          </div>
        </div>

        <Link
          href="/appointments"
          className="shrink-0 text-xs font-black uppercase tracking-[0.14em] text-primary transition hover:text-primary-hover"
        >
          Ver agenda
        </Link>
      </div>

      {appointmentsToShow.length > 0 ? (
        <div className="p-4 sm:p-5">
          <ol className="grid gap-3 lg:grid-cols-2">
            {appointmentsToShow.map((appointment) => (
              <AgendaItem key={appointment.id} appointment={appointment} />
            ))}
          </ol>

          {(isShowingUpcoming ? upcomingAppointments.length : todayAppointments.length) >
          appointmentsToShow.length ? (
            <Link
              href="/appointments"
              className="mt-5 inline-flex text-sm font-bold text-primary transition hover:text-primary-hover"
            >
              + {(isShowingUpcoming ? upcomingAppointments.length : todayAppointments.length) -
                appointmentsToShow.length} turno
              {(isShowingUpcoming ? upcomingAppointments.length : todayAppointments.length) -
                appointmentsToShow.length ===
              1
                ? ""
                : "s"} más
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="p-4 sm:p-5">
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface-muted/55 p-4 text-sm leading-6 text-muted-foreground sm:p-5">
            No hay turnos cargados para hoy ni próximos turnos pendientes.
          </div>
        </div>
      )}
    </section>
  );
}

function AgendaItem({ appointment }: { appointment: DashboardAppointment }) {
  const statusClasses = getAppointmentStatusClasses(appointment.status);
  const mainEntity =
    appointment.customer?.fullName ??
    appointment.vehicle?.licensePlate ??
    (appointment.workOrder ? `Orden #${appointment.workOrder.orderNumber}` : "Sin cliente");
  const secondaryText =
    appointment.description ??
    (appointment.vehicle
      ? `${appointment.vehicle.brand} ${appointment.vehicle.model}`.trim()
      : formatRelativeTime(appointment.scheduledStart));

  return (
    <li className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3 rounded-2xl border border-border bg-surface-muted/45 px-3.5 py-3 transition hover:border-primary/30 hover:bg-white sm:grid-cols-[3.75rem_minmax(0,1fr)_auto] sm:px-4">
      <time className="pt-1 text-sm font-black text-foreground">
        {formatTime(appointment.scheduledStart)}
      </time>

      <div className="relative min-w-0 border-l border-border pl-4">
        <span
          aria-hidden="true"
          className={`${statusClasses.dot} absolute -left-[5px] top-2 size-2.5 rounded-full ring-4 ring-white`}
        />

        <p className="line-clamp-1 text-sm font-black text-foreground">
          {appointment.title} · {mainEntity}
        </p>

        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
          {secondaryText}
        </p>
      </div>

      <span className={`${statusClasses.badge} col-start-2 w-fit sm:col-start-auto`}>
        {formatAppointmentStatus(appointment.status)}
      </span>
    </li>
  );
}

function getAppointmentStatusClasses(status: DashboardAppointment["status"]): {
  dot: string;
  badge: string;
} {
  if (status === "CONFIRMED") {
    return {
      dot: "bg-success",
      badge:
        "h-fit rounded-full border border-success/25 bg-success/10 px-3 py-1 text-[0.68rem] font-bold text-success",
    };
  }

  if (status === "COMPLETED") {
    return {
      dot: "bg-steel",
      badge:
        "h-fit rounded-full border border-border-strong bg-surface-muted px-3 py-1 text-[0.68rem] font-bold text-muted-foreground",
    };
  }

  if (status === "CANCELLED") {
    return {
      dot: "bg-muted-foreground",
      badge:
        "h-fit rounded-full border border-border-strong bg-surface-muted px-3 py-1 text-[0.68rem] font-bold text-muted-foreground",
    };
  }

  return {
    dot: "bg-warning",
    badge:
      "h-fit rounded-full border border-warning/25 bg-warning/10 px-3 py-1 text-[0.68rem] font-bold text-warning",
  };
}
