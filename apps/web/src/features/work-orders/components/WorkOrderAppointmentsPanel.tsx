import { CalendarClock, CalendarPlus, History } from "lucide-react";
import Link from "next/link";
import { AppointmentStatusBadge } from "../../appointments/components/AppointmentStatusBadge";
import type { Appointment } from "../../appointments/types";
import type { WorkOrder } from "../types";

type WorkOrderAppointmentsPanelProps = {
    workOrder: WorkOrder;
    appointments: Appointment[];
};

/**
 * Shows agenda appointments linked to one work order.
 *
 * This panel completes the operational loop:
 * work order -> scheduled appointment -> work order context.
 */
export function WorkOrderAppointmentsPanel({
    workOrder,
    appointments,
}: WorkOrderAppointmentsPanelProps) {
    const now = new Date();
    const canSchedule =
        workOrder.status !== "DELIVERED" && workOrder.status !== "CANCELLED";

    const upcomingAppointments = appointments
        .filter((appointment) => isUpcomingAppointment(appointment, now))
        .sort(compareAppointmentsAsc);

    const historicalAppointments = appointments
        .filter((appointment) => !isUpcomingAppointment(appointment, now))
        .sort(compareAppointmentsDesc);

    return (
        <section
            aria-labelledby="work-order-appointments-heading"
            className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3"
        >
            <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted text-primary">
                        <CalendarClock className="size-5" aria-hidden="true" />
                    </div>

                    <div className="min-w-0">
                        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                            Agenda vinculada
                        </p>

                        <h2
                            id="work-order-appointments-heading"
                            className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
                        >
                            Seguimientos y entregas programadas                        </h2>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                            Seguimientos, entregas o visitas programadas que fueron vinculadas
                            a esta orden de trabajo.
                        </p>
                    </div>
                </div>

                <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
                    {canSchedule ? (
                        <Link
                            href={`/appointments?range=all&workOrderId=${workOrder.id}`}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-hover"
                        >
                            <CalendarPlus className="size-4 shrink-0" aria-hidden="true" />
                            Agendar seguimiento
                        </Link>
                    ) : null}

                    <Link
                        href={`/appointments?range=all&search=${workOrder.orderNumber}`}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
                    >
                        <History className="size-4 shrink-0" aria-hidden="true" />
                        Ver en agenda
                    </Link>
                </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <SummaryPill label="Próximos" value={upcomingAppointments.length} />
                <SummaryPill label="Históricos" value={historicalAppointments.length} />
                <SummaryPill label="Total" value={appointments.length} />
            </div>

            {appointments.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-border-strong bg-surface-muted/65 p-5">
                    <p className="text-sm font-bold text-foreground">
                        Esta orden todavía no tiene turnos vinculados.
                    </p>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Agendá un seguimiento, una entrega o una visita para que aparezca en
                        este panel y también en la sección Agenda.
                    </p>
                </div>
            ) : (
                <div className="mt-5 space-y-5">
                    {upcomingAppointments.length > 0 ? (
                        <AppointmentGroup
                            title="Próximos turnos"
                            appointments={upcomingAppointments}
                        />
                    ) : null}

                    {historicalAppointments.length > 0 ? (
                        <AppointmentGroup
                            title="Historial de agenda"
                            appointments={historicalAppointments}
                        />
                    ) : null}
                </div>
            )}
        </section>
    );
}

type SummaryPillProps = {
    label: string;
    value: number;
};

/**
 * Small metric pill for linked appointment counts.
 */
function SummaryPill({ label, value }: SummaryPillProps) {
    return (
        <div className="rounded-2xl border border-border bg-surface-muted/75 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">
                {label}
            </p>

            <p className="mt-1 font-display text-2xl font-black text-foreground">
                {value}
            </p>
        </div>
    );
}

type AppointmentGroupProps = {
    title: string;
    appointments: Appointment[];
};

/**
 * Renders a grouped appointment list.
 */
function AppointmentGroup({ title, appointments }: AppointmentGroupProps) {
    return (
        <section aria-label={title}>
            <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                {title}
            </h3>

            <ol className="mt-3 space-y-3">
                {appointments.map((appointment) => (
                    <li key={appointment.id}>
                        <AppointmentMiniCard appointment={appointment} />
                    </li>
                ))}
            </ol>
        </section>
    );
}

type AppointmentMiniCardProps = {
    appointment: Appointment;
};

/**
 * Compact row for a linked appointment.
 */
function AppointmentMiniCard({ appointment }: AppointmentMiniCardProps) {
    return (
        <article className="rounded-2xl border border-border bg-surface-muted/75 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <p className="inline-flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-primary">
                        <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
                        {formatAppointmentTimeRange(
                            appointment.scheduledStart,
                            appointment.scheduledEnd,
                        )}
                    </p>

                    <h4 className="mt-2 wrap-anywhere text-sm font-black text-foreground">
                        {appointment.title}
                    </h4>

                    {appointment.description ? (
                        <p className="mt-1 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                            {appointment.description}
                        </p>
                    ) : null}
                </div>

                <AppointmentStatusBadge status={appointment.status} />
            </div>
        </article>
    );
}

/**
 * Determines whether an appointment is still operationally upcoming.
 */
function isUpcomingAppointment(appointment: Appointment, now: Date): boolean {
    const scheduledEnd = new Date(appointment.scheduledEnd);

    return (
        (appointment.status === "SCHEDULED" ||
            appointment.status === "CONFIRMED") &&
        scheduledEnd >= now
    );
}

/**
 * Sorts appointments from oldest to newest.
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
 * Sorts appointments from newest to oldest.
 */
function compareAppointmentsDesc(
    firstAppointment: Appointment,
    secondAppointment: Appointment,
): number {
    return (
        new Date(secondAppointment.scheduledStart).getTime() -
        new Date(firstAppointment.scheduledStart).getTime()
    );
}

/**
 * Formats the appointment start and end times.
 */
function formatAppointmentTimeRange(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);

    return `${formatDateTime(startDate)} - ${formatTime(endDate)}`;
}

/**
 * Formats date and time in Spanish.
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
