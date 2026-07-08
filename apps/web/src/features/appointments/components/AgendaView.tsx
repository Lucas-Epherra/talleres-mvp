import { EmptyState } from "../../../components/ui/EmptyState";
import { AppointmentCard } from "./AppointmentCard";
import type { AgendaRange, Appointment } from "../types";

type AgendaViewProps = {
  appointments: Appointment[];
  hasFilters: boolean;
  range: AgendaRange;
};

type AppointmentGroup = {
  key: string;
  title: string;
  description: string;
  appointments: Appointment[];
};

/**
 * Mobile-first agenda list.
 *
 * The view groups appointments by operational day so a workshop can quickly
 * scan what is overdue, what happens today and what is coming next.
 */
export function AgendaView({ appointments, hasFilters, range }: AgendaViewProps) {
  if (appointments.length === 0) {
    const emptyStateCopy = getEmptyStateCopy(hasFilters, range);

    return (
      <EmptyState
        eyebrow={emptyStateCopy.eyebrow}
        title={emptyStateCopy.title}
        description={emptyStateCopy.description}
        actions={[
          {
            label: "Nuevo turno",
            href: "/appointments/new",
            variant: "primary",
          },
          {
            label: "Limpiar filtros",
            href: "/appointments",
            variant: "secondary",
          },
        ]}
      />
    );
  }

  const groups = buildAppointmentGroups(appointments);

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section
          key={group.key}
          aria-labelledby={`agenda-group-${group.key}`}
          className="space-y-3"
        >
          <div className="rounded-[1.1rem] border border-border bg-surface/90 p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:rounded-[1.35rem] sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                  Bloque operativo
                </p>

                <h3
                  id={`agenda-group-${group.key}`}
                  className="mt-2 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground"
                >
                  {group.title}
                </h3>
              </div>

              <p className="w-fit rounded-full border border-border-strong bg-surface-muted px-3 py-1.5 text-[0.66rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
                {group.appointments.length} turno
                {group.appointments.length === 1 ? "" : "s"}
              </p>
            </div>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {group.description}
            </p>
          </div>

          <div className="grid gap-4">
            {group.appointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/**
 * Builds ordered appointment groups for the agenda list.
 */
function buildAppointmentGroups(appointments: Appointment[]): AppointmentGroup[] {
  const now = new Date();
  const groupsByKey = new Map<string, Appointment[]>();

  const sortedAppointments = [...appointments].sort(compareAppointmentsAsc);

  for (const appointment of sortedAppointments) {
    const groupKey = getAppointmentGroupKey(appointment, now);
    const currentGroup = groupsByKey.get(groupKey) ?? [];
    groupsByKey.set(groupKey, [...currentGroup, appointment]);
  }

  return [...groupsByKey.entries()].map(([key, groupAppointments]) => ({
    key,
    ...getGroupCopy(key),
    appointments: groupAppointments,
  }));
}

/**
 * Returns the group key used to cluster appointments by operational meaning.
 */
function getAppointmentGroupKey(appointment: Appointment, now: Date): string {
  if (isOverdueOperationalAppointment(appointment, now)) {
    return "overdue";
  }

  const scheduledStart = new Date(appointment.scheduledStart);

  if (isSameCalendarDay(scheduledStart, now)) {
    return "today";
  }

  if (isSameCalendarDay(scheduledStart, addDays(now, 1))) {
    return "tomorrow";
  }

  return startOfDay(scheduledStart).toISOString();
}

/**
 * Returns the title and help text for one agenda group.
 */
function getGroupCopy(key: string): Pick<AppointmentGroup, "title" | "description"> {
  if (key === "overdue") {
    return {
      title: "Atrasados",
      description:
        "Turnos pendientes o confirmados cuyo horario ya pasó. Conviene resolverlos antes de seguir con la agenda del día.",
    };
  }

  if (key === "today") {
    return {
      title: "Hoy",
      description: "Turnos que requieren atención durante la jornada actual.",
    };
  }

  if (key === "tomorrow") {
    return {
      title: "Mañana",
      description: "Turnos próximos que conviene dejar preparados.",
    };
  }

  return {
    title: formatLongDate(new Date(key)),
    description: "Turnos programados para esta fecha.",
  };
}

/**
 * Returns the empty state copy for the selected range.
 */
function getEmptyStateCopy(
  hasFilters: boolean,
  range: AgendaRange,
): {
  eyebrow: string;
  title: string;
  description: string;
} {
  if (range === "overdue") {
    return {
      eyebrow: "Sin atrasados",
      title: "No hay turnos atrasados",
      description:
        "Los turnos programados o confirmados que ya pasaron van a aparecer acá.",
    };
  }

  if (range === "today") {
    return {
      eyebrow: "Agenda libre",
      title: "No hay turnos para hoy",
      description:
        "La jornada aparece libre para este rango. Podés crear un turno nuevo o revisar próximos días.",
    };
  }

  if (range === "tomorrow") {
    return {
      eyebrow: "Agenda libre",
      title: "No hay turnos para mañana",
      description:
        "Todavía no hay visitas, entregas o seguimientos programados para mañana.",
    };
  }

  if (hasFilters) {
    return {
      eyebrow: "Sin resultados",
      title: "No se encontraron turnos",
      description:
        "Probá limpiar filtros o buscar por otro cliente, vehículo, motivo u orden.",
    };
  }

  return {
    eyebrow: "Agenda libre",
    title: "No hay turnos para este rango",
    description:
      "Cuando cargues turnos, visitas o trabajos programados, van a aparecer en esta agenda.",
  };
}

/**
 * Orders appointments by scheduled start date.
 */
function compareAppointmentsAsc(
  firstAppointment: Appointment,
  secondAppointment: Appointment,
): number {
  return (
    new Date(firstAppointment.scheduledStart).getTime() -
    new Date(secondAppointment.scheduledStart).getTime()
  );
}

/**
 * Returns true when an appointment is operational and already past due.
 */
function isOverdueOperationalAppointment(
  appointment: Appointment,
  now: Date,
): boolean {
  return (
    (appointment.status === "SCHEDULED" ||
      appointment.status === "CONFIRMED") &&
    new Date(appointment.scheduledEnd) < now
  );
}

/**
 * Formats one date as a readable Spanish group title.
 */
function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
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
