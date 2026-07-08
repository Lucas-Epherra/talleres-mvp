import {
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Plus,
  TriangleAlert,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "../../../components/ui/Pagination";
import { SearchForm } from "../../../components/ui/SearchForm";
import { AgendaView } from "../../../features/appointments/components/AgendaView";
import { CalendarWeekView } from "../../../features/appointments/components/CalendarWeekView";
import {
  getAppointmentCalendar,
  getPaginatedAppointments,
} from "../../../features/appointments/appointments.server";
import {
  AGENDA_RANGES,
  APPOINTMENT_STATUSES,
  AGENDA_VIEW_MODES,
  type AgendaRange,
  type AgendaViewMode,
  type Appointment,
  type AppointmentStatus,
} from "../../../features/appointments/types";

export const metadata: Metadata = {
  title: "Agenda",
};

const APPOINTMENTS_PAGE_LIMIT = 10;
const OVERDUE_APPOINTMENTS_PAGE_LIMIT = 50;

type AppointmentsPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    page?: string | string[];
    status?: string | string[];
    range?: string | string[];
    workOrderId?: string | string[];
    view?: string | string[];
  }>;
};

/**
 * Main workshop agenda page.
 *
 * This view is intentionally mobile-first and list-based. It groups turns by
 * operational meaning so the workshop can resolve overdue work first, then the
 * day and upcoming commitments.
 */
export default async function AppointmentsPage({
  searchParams,
}: AppointmentsPageProps) {
  const resolvedSearchParams = await searchParams;
  const search = normalizeSearchParam(resolvedSearchParams.search);
  const workOrderId = normalizeSearchParam(resolvedSearchParams.workOrderId);
  const page = normalizePageParam(resolvedSearchParams.page);
  const status = normalizeStatusParam(resolvedSearchParams.status);
  const range = normalizeRangeParam(resolvedSearchParams.range);
  const requestedViewMode = normalizeViewModeParam(resolvedSearchParams.view);
  const dateRange = buildDateRange(range);
  const canUseCalendarView = Boolean(dateRange.from && dateRange.to);
  const viewMode = canUseCalendarView ? requestedViewMode : "list";
  const queryLimit =
    range === "overdue"
      ? OVERDUE_APPOINTMENTS_PAGE_LIMIT
      : APPOINTMENTS_PAGE_LIMIT;

  const calendarResponse =
    viewMode === "calendar" && dateRange.from && dateRange.to
      ? await getAppointmentCalendar({
          search: search || undefined,
          status,
          from: dateRange.from,
          to: dateRange.to,
          workOrderId: workOrderId || undefined,
        })
      : null;

  const appointmentsPage = calendarResponse
    ? null
    : await getPaginatedAppointments({
        search: search || undefined,
        status,
        from: dateRange.from,
        to: dateRange.to,
        page,
        limit: queryLimit,
        workOrderId: workOrderId || undefined,
      });

  const appointments = calendarResponse
    ? calendarResponse.data
    : range === "overdue" && appointmentsPage
      ? appointmentsPage.data.filter(isOverdueOperationalAppointment)
      : (appointmentsPage?.data ?? []);

  const meta = appointmentsPage?.meta ?? null;
  const hasSearch = search.length > 0;
  const hasFilters =
    hasSearch ||
    Boolean(status) ||
    range !== "week" ||
    Boolean(workOrderId) ||
    viewMode !== "list";
  const overdueCount = appointments.filter(isOverdueOperationalAppointment).length;

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
              Turnos, entregas y seguimientos vinculados a clientes, vehículos
              y órdenes. Primero resolvé atrasados, después la jornada y los
              próximos compromisos.
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
            workOrderId: workOrderId || undefined,
          })}
          showClearAction={hasSearch}
        />

        <AppointmentRangeFilters
          currentRange={range}
          search={search || undefined}
          status={status}
          workOrderId={workOrderId || undefined}
          viewMode={viewMode}
        />

        <AppointmentViewModeFilters
          currentViewMode={viewMode}
          canUseCalendarView={canUseCalendarView}
          search={search || undefined}
          status={status}
          range={range}
          workOrderId={workOrderId || undefined}
        />

        <AppointmentStatusFilters
          currentStatus={status}
          search={search || undefined}
          range={range}
          workOrderId={workOrderId || undefined}
          viewMode={viewMode}
        />
      </header>

      <AppointmentSummary appointments={appointments} />

      <AgendaOperationalNotice
        overdueCount={overdueCount}
        range={range}
        workOrderId={workOrderId || undefined}
      />

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

            {meta && meta.totalItems > 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Página {meta.page} de {meta.totalPages}
              </p>
            ) : calendarResponse ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {calendarResponse.range.days} día{calendarResponse.range.days === 1 ? "" : "s"} visibles
              </p>
            ) : null}
          </div>

          <p className="shrink-0 text-sm font-semibold text-muted-foreground">
            {appointments.length} turno{appointments.length === 1 ? "" : "s"} en esta vista
          </p>
        </div>

        {calendarResponse ? (
          <CalendarWeekView
            appointments={appointments}
            rangeStart={calendarResponse.range.from}
            rangeEnd={calendarResponse.range.to}
            summary={calendarResponse.summary}
            hasFilters={hasFilters}
          />
        ) : (
          <>
            <AgendaView
              appointments={appointments}
              hasFilters={hasFilters}
              range={range}
            />

            {meta ? (
              <Pagination
                basePath="/appointments"
                currentPage={meta.page}
                totalPages={meta.totalPages}
                searchParams={{
                  search: search || undefined,
                  status,
                  range: range !== "week" ? range : undefined,
                  workOrderId: workOrderId || undefined,
                  view: viewMode !== "list" ? viewMode : undefined,
                }}
                ariaLabel="Paginación de agenda"
              />
            ) : null}
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
  const now = new Date();
  const activeCount = appointments.filter(isOperationalAppointment).length;
  const todayCount = appointments.filter((appointment) =>
    isSameCalendarDay(new Date(appointment.scheduledStart), now),
  ).length;
  const overdueCount = appointments.filter(isOverdueOperationalAppointment).length;
  const linkedWorkOrdersCount = appointments.filter(
    (appointment) => appointment.workOrderId,
  ).length;

  return (
    <section
      aria-label="Resumen de agenda"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <SummaryCard label="Por atender" value={activeCount.toString()} />
      <SummaryCard label="Hoy" value={todayCount.toString()} />
      <SummaryCard
        label="Atrasados"
        value={overdueCount.toString()}
        tone={overdueCount > 0 ? "warning" : "neutral"}
      />
      <SummaryCard label="Con orden" value={linkedWorkOrdersCount.toString()} />
    </section>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  tone?: "neutral" | "warning";
};

/**
 * Small agenda metric card.
 */
function SummaryCard({ label, value, tone = "neutral" }: SummaryCardProps) {
  return (
    <div
      className={
        tone === "warning"
          ? "rounded-2xl border border-warning/45 bg-warning/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
          : "rounded-2xl border border-border bg-surface-muted/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
      }
    >
      <p
        className={
          tone === "warning"
            ? "text-[0.68rem] font-bold uppercase tracking-[0.22em] text-warning"
            : "text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary"
        }
      >
        {label}
      </p>

      <p className="mt-2 font-display text-xl font-black text-foreground">
        {value}
      </p>
    </div>
  );
}

type AgendaOperationalNoticeProps = {
  overdueCount: number;
  range: AgendaRange;
  workOrderId?: string;
};

/**
 * Gives context when the agenda needs special attention or is filtered by order.
 */
function AgendaOperationalNotice({
  overdueCount,
  range,
  workOrderId,
}: AgendaOperationalNoticeProps) {
  if (overdueCount === 0 && !workOrderId && range !== "overdue") {
    return null;
  }

  if (overdueCount > 0) {
    return (
      <section className="rounded-[1.1rem] border border-warning/45 bg-warning/10 p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:rounded-[1.35rem] sm:p-5">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-warning/45 bg-surface text-warning">
            <TriangleAlert className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-warning">
              Requiere atención
            </p>

            <h2 className="mt-2 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground">
              Hay turnos atrasados
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Tenés {overdueCount} turno{overdueCount === 1 ? "" : "s"} cuyo
              horario ya pasó y sigue pendiente o confirmado. Resolvelos antes
              de avanzar con nuevos trabajos para mantener limpia la agenda.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (workOrderId) {
    return (
      <section className="rounded-[1.1rem] border border-border bg-surface-muted/85 p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:rounded-[1.35rem] sm:p-5">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface text-primary">
            <ClipboardList className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              Filtro aplicado
            </p>

            <h2 className="mt-2 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground">
              Turnos vinculados a una orden
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Estás viendo solo la agenda relacionada con una orden de trabajo.
              Limpiá filtros para volver a la agenda completa.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[1.1rem] border border-border bg-surface-muted/85 p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:rounded-[1.35rem] sm:p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface text-primary">
          <CalendarClock className="size-5" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Atrasados
          </p>

          <h2 className="mt-2 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground">
            No hay pendientes vencidos
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            La agenda no tiene turnos programados o confirmados vencidos en esta
            vista.
          </p>
        </div>
      </div>
    </section>
  );
}

type AppointmentRangeFiltersProps = {
  currentRange: AgendaRange;
  search?: string;
  status?: AppointmentStatus;
  workOrderId?: string;
  viewMode: AgendaViewMode;
};

/**
 * Server-rendered agenda view filters.
 *
 * Desktop uses quick buttons. Mobile uses a select to avoid dense horizontal
 * chip rows and make "Atrasados" easier to understand as a view.
 */
function AppointmentRangeFilters({
  currentRange,
  search,
  status,
  workOrderId,
  viewMode,
}: AppointmentRangeFiltersProps) {
  const filters: Array<{
    label: string;
    shortLabel: string;
    value: AgendaRange;
  }> = [
    { label: "Hoy", shortLabel: "Hoy", value: "today" },
    { label: "Mañana", shortLabel: "Mañana", value: "tomorrow" },
    { label: "Próximos 7 días", shortLabel: "Semana", value: "week" },
    { label: "Atrasados", shortLabel: "Atrasados", value: "overdue" },
    { label: "Todos los turnos", shortLabel: "Todos", value: "all" },
  ];

  return (
    <section
      aria-labelledby="appointment-range-filter-heading"
      className="mt-5"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="appointment-range-filter-heading"
          className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary"
        >
          Vista de agenda
        </h2>

        <p className="text-xs leading-5 text-muted-foreground">
          Elegí qué ventana operativa querés revisar.
        </p>
      </div>

      <form action="/appointments" className="mt-2 grid gap-2 sm:hidden">
        {search ? <input type="hidden" name="search" value={search} /> : null}

        {status ? <input type="hidden" name="status" value={status} /> : null}

        {workOrderId ? (
          <input type="hidden" name="workOrderId" value={workOrderId} />
        ) : null}

        {viewMode !== "list" ? (
          <input type="hidden" name="view" value={viewMode} />
        ) : null}

        <select
          name="range"
          defaultValue={currentRange}
          aria-label="Seleccionar vista de agenda"
          className="h-11 w-full rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {filters.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-hover"
        >
          Aplicar vista
        </button>
      </form>

      <nav
        aria-label="Filtro de vista de agenda"
        className="mt-2 hidden flex-wrap gap-2 sm:flex"
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
                workOrderId,
                view: viewMode,
              })}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "inline-flex h-10 items-center justify-center rounded-xl border border-primary bg-primary px-4 text-sm font-bold text-white"
                  : "inline-flex h-10 items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
              }
            >
              {filter.shortLabel}
            </Link>
          );
        })}
      </nav>
    </section>
  );
}

type AppointmentViewModeFiltersProps = {
  currentViewMode: AgendaViewMode;
  canUseCalendarView: boolean;
  search?: string;
  status?: AppointmentStatus;
  range: AgendaRange;
  workOrderId?: string;
};

/**
 * Switches between the operational list and the calendar-style view.
 */
function AppointmentViewModeFilters({
  currentViewMode,
  canUseCalendarView,
  search,
  status,
  range,
  workOrderId,
}: AppointmentViewModeFiltersProps) {
  return (
    <section aria-labelledby="appointment-view-filter-heading" className="mt-4">
      <div className="flex flex-col gap-1">
        <h2
          id="appointment-view-filter-heading"
          className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary"
        >
          Formato
        </h2>

        <p className="text-xs leading-5 text-muted-foreground">
          Usá lista para resolver turnos rápido o calendario para ver carga por día.
        </p>
      </div>

      <nav aria-label="Formato de agenda" className="mt-2 flex flex-wrap gap-2">
        <Link
          href={buildAppointmentsHref({
            search,
            status,
            range,
            workOrderId,
            view: "list",
          })}
          aria-current={currentViewMode === "list" ? "page" : undefined}
          className={
            currentViewMode === "list"
              ? "inline-flex h-10 items-center justify-center rounded-xl border border-primary bg-primary px-4 text-sm font-bold text-white"
              : "inline-flex h-10 items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
          }
        >
          Lista
        </Link>

        {canUseCalendarView ? (
          <Link
            href={buildAppointmentsHref({
              search,
              status,
              range,
              workOrderId,
              view: "calendar",
            })}
            aria-current={currentViewMode === "calendar" ? "page" : undefined}
            className={
              currentViewMode === "calendar"
                ? "inline-flex h-10 items-center justify-center rounded-xl border border-primary bg-primary px-4 text-sm font-bold text-white"
                : "inline-flex h-10 items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
            }
          >
            Calendario
          </Link>
        ) : (
          <span className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface-muted px-4 text-sm font-bold text-muted-foreground">
            Calendario no disponible para esta vista
          </span>
        )}
      </nav>
    </section>
  );
}

type AppointmentStatusFiltersProps = {
  currentStatus?: AppointmentStatus;
  search?: string;
  range: AgendaRange;
  workOrderId?: string;
  viewMode: AgendaViewMode;
};

/**
 * Server-rendered status filters for agenda navigation.
 *
 * Desktop uses buttons for quick filtering. Mobile uses a select to avoid a
 * dense second row of chips.
 */
function AppointmentStatusFilters({
  currentStatus,
  search,
  range,
  workOrderId,
  viewMode,
}: AppointmentStatusFiltersProps) {
  const filters: Array<{
    label: string;
    value?: AppointmentStatus;
  }> = [
    { label: "Todos los estados" },
    { label: "Programados", value: "SCHEDULED" },
    { label: "Confirmados", value: "CONFIRMED" },
    { label: "Completados", value: "COMPLETED" },
    { label: "Cancelados", value: "CANCELLED" },
  ];

  return (
    <section
      aria-labelledby="appointment-status-filter-heading"
      className="mt-4"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="appointment-status-filter-heading"
          className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary"
        >
          Estado del turno
        </h2>

        <p className="text-xs leading-5 text-muted-foreground">
          Filtrá por avance operativo del turno.
        </p>
      </div>

      <form action="/appointments" className="mt-2 grid gap-2 sm:hidden">
        {search ? <input type="hidden" name="search" value={search} /> : null}

        {range !== "week" ? (
          <input type="hidden" name="range" value={range} />
        ) : null}

        {workOrderId ? (
          <input type="hidden" name="workOrderId" value={workOrderId} />
        ) : null}

        {viewMode !== "list" ? (
          <input type="hidden" name="view" value={viewMode} />
        ) : null}

        <select
          name="status"
          defaultValue={currentStatus ?? ""}
          aria-label="Filtrar por estado del turno"
          className="h-11 w-full rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {filters.map((filter) => (
            <option key={filter.value ?? "all"} value={filter.value ?? ""}>
              {filter.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-hover"
        >
          Aplicar estado
        </button>
      </form>

      <nav
        aria-label="Filtro de estado de agenda"
        className="mt-2 hidden flex-wrap gap-2 sm:flex"
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
                workOrderId,
                view: viewMode,
              })}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "inline-flex h-10 items-center justify-center rounded-xl border border-primary bg-primary px-4 text-sm font-bold text-white"
                  : "inline-flex h-10 items-center justify-center rounded-xl border border-border-strong bg-surface px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
              }
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>
    </section>
  );
}

/**
 * Builds an appointments href preserving only meaningful filters.
 */
function buildAppointmentsHref({
  search,
  status,
  range,
  workOrderId,
  view,
}: {
  search?: string;
  status?: AppointmentStatus;
  range?: AgendaRange;
  workOrderId?: string;
  view?: AgendaViewMode;
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

  if (workOrderId) {
    params.set("workOrderId", workOrderId);
  }

  if (view && view !== "list") {
    params.set("view", view);
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
 * Returns true when an appointment still needs operational resolution.
 */
function isOperationalAppointment(appointment: Appointment): boolean {
  return appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED";
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
 * Normalizes an agenda view mode search param.
 */
function normalizeViewModeParam(
  value: string | string[] | undefined,
): AgendaViewMode {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (AGENDA_VIEW_MODES.some((viewMode) => viewMode === rawValue)) {
    return rawValue as AgendaViewMode;
  }

  return "list";
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
