import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { MonthAppointmentChip } from "./MonthAppointmentChip";
import type { Appointment, AppointmentCalendarSummary } from "../types";

type CalendarMonthViewProps = {
  appointments: Appointment[];
  rangeStart: string;
  rangeEnd: string;
  visibleMonth: string;
  summary: AppointmentCalendarSummary;
  hasFilters: boolean;
  previousMonthHref: string;
  nextMonthHref: string;
  todayHref: string;
};

/**
 * Monthly calendar view for the workshop agenda.
 *
 * The component renders a complete calendar grid even when there are no
 * appointments. Monthly cells intentionally show compact appointment previews:
 * the full operational context stays available by clicking the appointment.
 */
export function CalendarMonthView({
  appointments,
  rangeStart,
  rangeEnd,
  visibleMonth,
  summary,
  hasFilters,
  previousMonthHref,
  nextMonthHref,
  todayHref,
}: CalendarMonthViewProps) {
  const visibleMonthDate = parseCalendarMonth(visibleMonth);
  const days = buildCalendarDays(rangeStart, rangeEnd, visibleMonthDate);
  const weeks = chunkDays(days, 7);
  const monthTitle = formatMonthTitle(visibleMonthDate);

  return (
    <section
      aria-labelledby="agenda-calendar-heading"
      className="overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated shadow-(--shadow-industrial) ring-1 ring-white/3"
    >
      <header className="p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
              <CalendarDays className="size-5" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                Calendario
              </p>

              <h2
                id="agenda-calendar-heading"
                className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground sm:text-2xl"
              >
                Vista mensual
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {hasFilters
                  ? "Vista mensual filtrada. La grilla se mantiene completa para revisar disponibilidad aunque algunos días no tengan resultados."
                  : "Mes completo del taller. Revisá disponibilidad, carga diaria y turnos vinculados sin sobrecargar la agenda."}
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:min-w-lg">
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
            <CalendarSummaryPill
              label="Con orden"
              value={summary.linkedWorkOrders}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-surface-muted/70 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href={previousMonthHref}
              aria-label="Ver mes anterior"
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-border-strong bg-surface text-foreground transition hover:border-primary/60 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Link>

            <div className="min-w-0 rounded-xl border border-border bg-surface px-4 py-2 text-center sm:min-w-64">
              <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-primary">
                Mes visible
              </p>
              <p className="mt-1 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground">
                {monthTitle}
              </p>
            </div>

            <Link
              href={nextMonthHref}
              aria-label="Ver mes siguiente"
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-border-strong bg-surface text-foreground transition hover:border-primary/60 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <Link
            href={todayHref}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          >
            <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
            Volver a este mes
          </Link>
        </div>
      </header>

      <div className="border-t border-border bg-surface-muted/35 px-3 pb-4 pt-3 sm:px-4 sm:pb-5 lg:px-5">
        <div className="hidden grid-cols-7 overflow-hidden rounded-t-2xl border border-b-0 border-border bg-surface-elevated/85 lg:grid">
          {WEEKDAY_LABELS.map((weekday) => (
            <div
              key={weekday}
              className="border-r border-border px-3 py-2 last:border-r-0"
            >
              <p className="text-center text-[0.62rem] font-black uppercase tracking-[0.2em] text-muted-foreground">
                {weekday}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 lg:gap-0">
          {weeks.map((week, weekIndex) => (
            <div
              key={`week-${week[0]?.key ?? weekIndex.toString()}`}
              className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 lg:gap-0"
            >
              {week.map((day) => (
                <CalendarDayCell
                  key={day.key}
                  day={day}
                  appointments={getAppointmentsForDay(appointments, day.date)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const MAX_VISIBLE_APPOINTMENTS_PER_DAY = 2;

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
      className={buildClassName(
        "rounded-2xl border px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.64)] transition hover:-translate-y-0.5",
        tone === "warning"
          ? "border-warning/45 bg-warning/10"
          : "border-border bg-surface-muted/85 hover:border-primary/30",
      )}
    >
      <p
        className={buildClassName(
          "text-[0.62rem] font-bold uppercase tracking-[0.16em]",
          tone === "warning" ? "text-warning" : "text-primary",
        )}
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
  isCurrentMonth: boolean;
};

type CalendarDayCellProps = {
  day: CalendarDay;
  appointments: Appointment[];
};

/**
 * One day cell inside the monthly calendar grid.
 */
function CalendarDayCell({ day, appointments }: CalendarDayCellProps) {
  const isToday = isSameCalendarDay(day.date, new Date());
  const visibleAppointments = appointments.slice(
    0,
    MAX_VISIBLE_APPOINTMENTS_PER_DAY,
  );
  const hiddenAppointments = Math.max(
    appointments.length - MAX_VISIBLE_APPOINTMENTS_PER_DAY,
    0,
  );

  return (
    <section
      aria-labelledby={`agenda-day-${day.key}`}
      className={buildClassName(
        "min-h-36 rounded-2xl border border-border bg-surface p-2.5 ring-1 ring-white/3 transition hover:border-primary/35 hover:bg-surface-elevated/75 sm:p-3 lg:min-h-40 lg:rounded-none lg:border-0 lg:border-r lg:border-t lg:ring-0 lg:first:border-l",
        weekBorderClassName(day.date),
        !day.isCurrentMonth
          ? "bg-surface-muted/45 text-muted-foreground hover:bg-surface-muted/65"
          : "",
        isToday
          ? "border-primary/45 bg-primary/10 shadow-[inset_3px_0_0_rgb(var(--color-primary))] lg:bg-primary/10"
          : "",
      )}
    >
      <header className="flex items-start justify-between gap-2 border-b border-border/80 pb-2">
        <div className="min-w-0">
          <p
            className={buildClassName(
              "text-[0.58rem] font-black uppercase tracking-[0.18em] lg:hidden",
              isToday ? "text-primary" : "text-muted-foreground",
            )}
          >
            {isToday ? "Hoy" : formatWeekday(day.date)}
          </p>

          <h3
            id={`agenda-day-${day.key}`}
            className={buildClassName(
              "mt-1 font-display text-sm font-black uppercase tracking-[0.03em] text-foreground lg:mt-0",
              !day.isCurrentMonth ? "text-muted-foreground" : "",
            )}
          >
            {formatDayNumber(day.date)}
          </h3>
        </div>

        <span
          className={buildClassName(
            "inline-flex size-6 shrink-0 items-center justify-center rounded-full border text-[0.68rem] font-black",
            appointments.length > 0
              ? "border-primary/35 bg-primary/10 text-primary"
              : "border-border bg-surface-muted text-muted-foreground",
          )}
          aria-label={`${appointments.length} turno${
            appointments.length === 1 ? "" : "s"
          }`}
        >
          {appointments.length}
        </span>
      </header>

      {appointments.length > 0 ? (
        <div className="mt-2 space-y-1.5">
          {visibleAppointments.map((appointment) => (
            <MonthAppointmentChip
              key={appointment.id}
              appointment={appointment}
            />
          ))}

          {hiddenAppointments > 0 ? (
            <p
              className="rounded-lg border border-border bg-surface-muted/80 px-2 py-1.5 text-[0.68rem] font-black text-muted-foreground"
              title={buildHiddenAppointmentsTitle(
                appointments.slice(MAX_VISIBLE_APPOINTMENTS_PER_DAY),
              )}
            >
              +{hiddenAppointments} turno{hiddenAppointments === 1 ? "" : "s"} más
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-border bg-surface-muted/55 px-2 py-2 text-center text-[0.68rem] font-bold text-muted-foreground">
          Sin turnos
        </p>
      )}
    </section>
  );
}

/**
 * Builds visible days from a [start, end) range and marks the active month.
 */
function buildCalendarDays(
  rangeStart: string,
  rangeEnd: string,
  visibleMonth: Date,
): CalendarDay[] {
  const start = startOfDay(new Date(rangeStart));
  const end = startOfDay(new Date(rangeEnd));
  const days: CalendarDay[] = [];

  for (let currentDate = start; currentDate < end; ) {
    const day = new Date(currentDate);
    days.push({
      key: day.toISOString().slice(0, 10),
      date: day,
      isCurrentMonth:
        day.getFullYear() === visibleMonth.getFullYear() &&
        day.getMonth() === visibleMonth.getMonth(),
    });

    currentDate = addDays(currentDate, 1);
  }

  return days;
}

/**
 * Splits day cells into calendar weeks.
 */
function chunkDays(days: CalendarDay[], size: number): CalendarDay[][] {
  const chunks: CalendarDay[][] = [];

  for (let index = 0; index < days.length; index += size) {
    chunks.push(days.slice(index, index + size));
  }

  return chunks;
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
 * Builds a compact title for appointments hidden behind the +N indicator.
 */
function buildHiddenAppointmentsTitle(appointments: Appointment[]): string {
  return appointments
    .map(
      (appointment) =>
        `${formatAppointmentStartTime(appointment.scheduledStart)} · ${
          appointment.title
        }`,
    )
    .join("\n");
}

/**
 * Formats only the appointment start time.
 */
function formatAppointmentStartTime(start: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(start));
}

/**
 * Formats the visible month title.
 */
function formatMonthTitle(date: Date): string {
  const formatter = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  });

  return capitalizeFirstLetter(formatter.format(date));
}

/**
 * Formats weekday label for mobile/tablet cells.
 */
function formatWeekday(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
  }).format(date);
}

/**
 * Formats the day number inside one calendar cell.
 */
function formatDayNumber(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

/**
 * Parses a YYYY-MM month string as a local Date.
 */
function parseCalendarMonth(month: string): Date {
  const [yearValue, monthValue] = month.split("-");
  const year = Number(yearValue);
  const monthIndex = Number(monthValue) - 1;

  return new Date(year, monthIndex, 1);
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

/**
 * Adds the left border to desktop calendar rows that start on Sunday.
 */
function weekBorderClassName(date: Date): string {
  return date.getDay() === 0 ? "lg:border-l" : "";
}

/**
 * Capitalizes the first letter of a display label.
 */
function capitalizeFirstLetter(value: string): string {
  return value.length > 0 ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}

/**
 * Joins class names while ignoring empty values.
 */
function buildClassName(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
