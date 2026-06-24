import { CalendarDays, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Pagination } from "../../../components/ui/Pagination";
import { SearchForm } from "../../../components/ui/SearchForm";
import { AgendaView } from "../../../features/appointments/components/AgendaView";
import { getPaginatedAppointments } from "../../../features/appointments/appointments.server";
import {
  AGENDA_RANGES,
  APPOINTMENT_STATUSES,
  type AgendaRange,
  type Appointment,
  type AppointmentStatus,
} from "../../../features/appointments/types";

export const metadata: Metadata = {
  title: "Agenda",
};

const APPOINTMENTS_PAGE_LIMIT = 10;

type AppointmentsPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    page?: string | string[];
    status?: string | string[];
    range?: string | string[];
  }>;
};

/**
 * Main workshop agenda page.
 *
 * The first version is intentionally mobile-first and list-based. Calendar UI
 * can be added later using the same Appointment model and range filters.
 */
export default async function AppointmentsPage({
  searchParams,
}: AppointmentsPageProps) {
  const resolvedSearchParams = await searchParams;
  const search = normalizeSearchParam(resolvedSearchParams.search);
  const page = normalizePageParam(resolvedSearchParams.page);
  const status = normalizeStatusParam(resolvedSearchParams.status);
  const range = normalizeRangeParam(resolvedSearchParams.range);
  const dateRange = buildDateRange(range);

  const appointmentsPage = await getPaginatedAppointments({
    search: search || undefined,
    status,
    from: dateRange.from,
    to: dateRange.to,
    page,
    limit: APPOINTMENTS_PAGE_LIMIT,
  });

  const appointments =
    range === "overdue"
      ? appointmentsPage.data.filter(isOverdueOperationalAppointment)
      : appointmentsPage.data;

  const meta = appointmentsPage.meta;
  const hasSearch = search.length > 0;
  const hasFilters = hasSearch || Boolean(status) || range !== "week";

  return (
    <section className="space-y-6 sm:space-y-8">
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
              Agenda
            </p>

            <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
              Agenda del taller
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Planificación de turnos, visitas y trabajos programados. Vista
              mobile first, lista para sumar calendario más adelante.
            </p>
          </div>

          <Link
            href="/appointments/new"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover sm:w-auto"
          >
            <Plus className="size-4 shrink-0" aria-hidden="true" />
            Nuevo turno
          </Link>
        </div>

        <SearchForm
          id="appointments-search"
          label="Buscar"
          defaultValue={search}
          placeholder="Buscar por cliente, vehículo, motivo u orden..."
          clearHref={buildAppointmentsHref({
            range,
            status,
          })}
          showClearAction={hasSearch}
        />

        <AppointmentRangeFilters
          currentRange={range}
          search={search || undefined}
          status={status}
        />

        <AppointmentStatusFilters
          currentStatus={status}
          search={search || undefined}
          range={range}
        />
      </header>

      <AppointmentSummary appointments={appointments} />

      <section
        aria-labelledby="appointments-results-heading"
        className="space-y-4"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h2
              id="appointments-results-heading"
              className="font-display text-lg font-black uppercase tracking-[0.04em] text-foreground"
            >
              {getResultsTitle(range, hasSearch)}
            </h2>

            {meta.totalItems > 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Página {meta.page} de {meta.totalPages}
              </p>
            ) : null}
          </div>

          <p className="shrink-0 text-sm font-semibold text-muted-foreground">
            {appointments.length} turno{appointments.length === 1 ? "" : "s"}
          </p>
        </div>

        {range === "overdue" && appointments.length === 0 ? (
          <EmptyState
            eyebrow="Sin atrasados"
            title="No hay turnos atrasados"
            description="Los turnos programados o confirmados que ya pasaron van a aparecer acá."
            actions={[
              {
                label: "Ver hoy",
                href: "/appointments",
                variant: "primary",
              },
              {
                label: "Nuevo turno",
                href: "/appointments/new",
                variant: "secondary",
              },
            ]}
          />
        ) : (
          <>
            <AgendaView appointments={appointments} hasFilters={hasFilters} />

            <Pagination
              basePath="/appointments"
              currentPage={meta.page}
              totalPages={meta.totalPages}
              searchParams={{
                search: search || undefined,
                status,
                range: range !== "week" ? range : undefined,
              }}
              ariaLabel="Paginación de agenda"
            />
          </>
        )}
      </section>
    </section>
  );
}

type AppointmentSummaryProps = {
  appointments: Appointment[];
};

/**
 * Compact operational summary for the current agenda result set.
 */
function AppointmentSummary({ appointments }: AppointmentSummaryProps) {
  const scheduledCount = appointments.filter(
    (appointment) => appointment.status === "SCHEDULED",
  ).length;
  const confirmedCount = appointments.filter(
    (appointment) => appointment.status === "CONFIRMED",
  ).length;
  const completedCount = appointments.filter(
    (appointment) => appointment.status === "COMPLETED",
  ).length;
  const cancelledCount = appointments.filter(
    (appointment) => appointment.status === "CANCELLED",
  ).length;

  return (
    <section
      aria-label="Resumen de agenda"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <SummaryCard label="Programados" value={scheduledCount.toString()} />
      <SummaryCard label="Confirmados" value={confirmedCount.toString()} />
      <SummaryCard label="Completados" value={completedCount.toString()} />
      <SummaryCard label="Cancelados" value={cancelledCount.toString()} />
    </section>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
};

/**
 * Small agenda metric card.
 */
function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
        {label}
      </p>

      <p className="mt-2 font-display text-xl font-black text-foreground">
        {value}
      </p>
    </div>
  );
}

type AppointmentRangeFiltersProps = {
  currentRange: AgendaRange;
  search?: string;
  status?: AppointmentStatus;
};

/**
 * Server-rendered range filters for agenda navigation.
 */
function AppointmentRangeFilters({
  currentRange,
  search,
  status,
}: AppointmentRangeFiltersProps) {
  const filters: Array<{
    label: string;
    value: AgendaRange;
  }> = [
    { label: "Hoy", value: "today" },
    { label: "Mañana", value: "tomorrow" },
    { label: "Semana", value: "week" },
    { label: "Atrasados", value: "overdue" },
    { label: "Todos", value: "all" },
  ];

  return (
    <nav
      aria-label="Filtro de rango de agenda"
      className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
    >
      {filters.map((filter) => {
        const isActive = currentRange === filter.value;

        return (
          <Link
            key={filter.value}
            href={buildAppointmentsHref({
              search,
              status,
              range: filter.value,
            })}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white"
                : "inline-flex h-10 items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
            }
          >
            {filter.label}
          </Link>
        );
      })}
    </nav>
  );
}

type AppointmentStatusFiltersProps = {
  currentStatus?: AppointmentStatus;
  search?: string;
  range: AgendaRange;
};

/**
 * Server-rendered status filters for agenda navigation.
 */
function AppointmentStatusFilters({
  currentStatus,
  search,
  range,
}: AppointmentStatusFiltersProps) {
  const filters: Array<{
    label: string;
    value?: AppointmentStatus;
  }> = [
    { label: "Todos" },
    { label: "Programados", value: "SCHEDULED" },
    { label: "Confirmados", value: "CONFIRMED" },
    { label: "Completados", value: "COMPLETED" },
    { label: "Cancelados", value: "CANCELLED" },
  ];

  return (
    <nav
      aria-label="Filtro de estado de agenda"
      className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
    >
      {filters.map((filter) => {
        const isActive = currentStatus === filter.value;

        return (
          <Link
            key={filter.value ?? "all"}
            href={buildAppointmentsHref({
              search,
              range,
              status: filter.value,
            })}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-bold text-background"
                : "inline-flex h-10 items-center justify-center rounded-xl border border-border-strong bg-surface px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
            }
          >
            {filter.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Builds an appointments href preserving only meaningful filters.
 */
function buildAppointmentsHref({
  search,
  status,
  range,
}: {
  search?: string;
  status?: AppointmentStatus;
  range?: AgendaRange;
}): string {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (status) {
    params.set("status", status);
  }

  if (range && range !== "week") {
    params.set("range", range);
  }

  const queryString = params.toString();

  return queryString ? `/appointments?${queryString}` : "/appointments";
}

/**
 * Builds date boundaries for agenda ranges.
 */
function buildDateRange(range: AgendaRange): { from?: string; to?: string } {
  const now = new Date();

  if (range === "all") {
    return {};
  }

  if (range === "overdue") {
    return {
      to: now.toISOString(),
    };
  }

  const todayStart = startOfDay(now);

  if (range === "today") {
    return {
      from: todayStart.toISOString(),
      to: addDays(todayStart, 1).toISOString(),
    };
  }

  if (range === "tomorrow") {
    const tomorrowStart = addDays(todayStart, 1);

    return {
      from: tomorrowStart.toISOString(),
      to: addDays(tomorrowStart, 1).toISOString(),
    };
  }

  return {
    from: todayStart.toISOString(),
    to: addDays(todayStart, 7).toISOString(),
  };
}

/**
 * Returns true when an appointment should appear as overdue.
 */
function isOverdueOperationalAppointment(appointment: Appointment): boolean {
  const now = new Date();

  return (
    (appointment.status === "SCHEDULED" ||
      appointment.status === "CONFIRMED") &&
    new Date(appointment.scheduledEnd) < now
  );
}

/**
 * Normalizes an agenda range search param.
 */
function normalizeRangeParam(
  value: string | string[] | undefined,
): AgendaRange {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (AGENDA_RANGES.some((range) => range === rawValue)) {
    return rawValue as AgendaRange;
  }

  return "week";
}

/**
 * Normalizes an appointment status search param.
 */
function normalizeStatusParam(
  value: string | string[] | undefined,
): AppointmentStatus | undefined {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (APPOINTMENT_STATUSES.some((status) => status === rawValue)) {
    return rawValue as AppointmentStatus;
  }

  return undefined;
}

/**
 * Normalizes a Next.js search param into a single trimmed string.
 */
function normalizeSearchParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return (value[0] ?? "").trim();
  }

  return (value ?? "").trim();
}

/**
 * Normalizes a page search param into a safe positive integer.
 */
function normalizePageParam(value: string | string[] | undefined): number {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = rawValue ? Number(rawValue) : 1;

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return 1;
  }

  return parsedValue;
}

/**
 * Returns the title for the current agenda result set.
 */
function getResultsTitle(range: AgendaRange, hasSearch: boolean): string {
  if (hasSearch) {
    return "Resultados";
  }

  const titles: Record<AgendaRange, string> = {
    today: "Turnos de hoy",
    tomorrow: "Turnos de mañana",
    week: "Próximos 7 días",
    overdue: "Turnos atrasados",
    all: "Todos los turnos",
  };

  return titles[range];
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
