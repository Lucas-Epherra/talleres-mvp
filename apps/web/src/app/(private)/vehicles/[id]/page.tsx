import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  History,
  ReceiptText,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { ApiError } from "../../../../lib/api";
import {
  formatDateTime,
  formatMoney,
  formatReceiptNumber,
} from "../../../../lib/format";
import { VehicleArchiveActions } from "../../../../features/vehicles/components/VehicleArchiveActions";
import { VehicleProfileHeader } from "../../../../features/vehicles/components/VehicleProfileHeader";
import { VehicleWorkOrdersPanel } from "../../../../features/vehicles/components/VehicleWorkOrdersPanel";
import { getVehicleProfile } from "../../../../features/vehicles/vehicles.server";
import type {
  VehicleAppointmentStatus,
  VehicleProfile,
  VehicleProfileAppointment,
  VehicleProfileEvent,
  VehicleProfileReceiptWithContext,
  VehicleProfileWorkOrder,
} from "../../../../features/vehicles/types";

type VehicleProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Ficha del vehículo",
};

/**
 * Vehicle profile page.
 *
 * Main operational view for a vehicle: technical data, customer context,
 * active work, history, receipts, appointments, recent events and critical
 * archive/restore actions.
 */
export default async function VehicleProfilePage({
  params,
}: VehicleProfilePageProps) {
  const { id } = await params;
  const profile = await resolveVehicleProfile(id);
  const receipts = getVehicleReceipts(profile);
  const events = profile.events ?? [];
  const appointments = profile.appointments ?? [];
  const nextAppointment = profile.nextAppointment ?? appointments[0] ?? null;
  const isArchived = Boolean(profile.vehicle.archivedAt);

  return (
    <section className="space-y-8">
      <VehicleProfileHeader profile={profile} />

      <section
        aria-label="Resumen operativo del vehículo"
        className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]"
      >
        <NextAppointmentPanel appointment={nextAppointment} />

        <ReceiptsPanel receipts={receipts} />
      </section>

      <VehicleWorkOrdersPanel
        title="Órdenes activas"
        description="Trabajos pendientes, en progreso o listos para entregar."
        emptyMessage="Este vehículo no tiene órdenes activas."
        workOrders={profile.activeWorkOrders ?? []}
      />

      <VehicleWorkOrdersPanel
        title="Historial"
        description="Trabajos cerrados por entrega o anulación."
        emptyMessage="Este vehículo todavía no tiene historial cerrado."
        workOrders={profile.history ?? []}
      />

      <VehicleEventsPanel events={events} />

      <section
        aria-labelledby="vehicle-critical-zone-heading"
        className="space-y-4"
      >
        <SectionHeading
          headingId="vehicle-critical-zone-heading"
          title="Zona crítica"
          description="Acciones sensibles sobre la ficha del vehículo. Usalas solo cuando corresponda sacarlo o devolverlo al flujo operativo."
          count={isArchived ? "Restauración" : "Archivado"}
        />

        <VehicleArchiveActions
          vehicleId={profile.vehicle.id}
          isArchived={isArchived}
          activeWorkOrdersCount={profile.summary.activeWorkOrders}
          archivedReason={profile.vehicle.archivedReason}
        />
      </section>
    </section>
  );
}

/**
 * Resolves the vehicle profile and maps backend 404 responses to the Next.js
 * not found boundary.
 */
async function resolveVehicleProfile(id: string): Promise<VehicleProfile> {
  try {
    return await getVehicleProfile(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}

function NextAppointmentPanel({
  appointment,
}: {
  appointment: VehicleProfileAppointment | null;
}) {
  return (
    <article className="overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated shadow-(--shadow-industrial) ring-1 ring-white/3">
      <PanelHeader
        icon={<CalendarDays className="size-5" aria-hidden="true" />}
        eyebrow="Agenda"
        title="Próximo turno"
        description="Turnos pendientes o confirmados vinculados al vehículo."
      />

      <div className="p-5 sm:p-6">
        {appointment ? (
          <div className="rounded-2xl border border-border bg-surface-muted/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-primary">
                  {formatAppointmentStatus(appointment.status)}
                </p>

                <h3 className="mt-2 wrap-anywhere font-display text-xl font-black uppercase tracking-[0.03em] text-foreground">
                  {appointment.title}
                </h3>

                {appointment.description ? (
                  <p className="mt-2 wrap-anywhere text-sm leading-6 text-muted-foreground">
                    {appointment.description}
                  </p>
                ) : null}
              </div>

              {appointment.workOrderId ? (
                <Link
                  href={`/work-orders/${appointment.workOrderId}`}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
                >
                  Ver orden
                </Link>
              ) : null}
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <SmallDatum
                label="Inicio"
                value={formatDateTime(appointment.scheduledStart)}
              />
              <SmallDatum
                label="Fin"
                value={formatDateTime(appointment.scheduledEnd)}
              />
            </dl>
          </div>
        ) : (
          <EmptyPanelMessage
            title="Sin turnos próximos"
            description="Cuando este vehículo tenga una cita pendiente o confirmada, va a aparecer acá."
          />
        )}
      </div>
    </article>
  );
}

function ReceiptsPanel({
  receipts,
}: {
  receipts: VehicleProfileReceiptWithContext[];
}) {
  return (
    <article className="overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated shadow-(--shadow-industrial) ring-1 ring-white/3">
      <PanelHeader
        icon={<ReceiptText className="size-5" aria-hidden="true" />}
        eyebrow="Cobro"
        title="Últimos recibos"
        description="Comprobantes internos emitidos desde órdenes de este vehículo."
      />

      <div className="p-5 sm:p-6">
        {receipts.length > 0 ? (
          <div className="grid gap-3">
            {receipts.map((receipt) => (
              <Link
                key={receipt.id}
                href={`/receipts/${receipt.id}`}
                className="group rounded-2xl border border-border bg-surface-muted/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition hover:border-primary/40 hover:bg-surface"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-primary">
                      Recibo #{formatReceiptNumber(receipt.receiptNumber)}
                    </p>

                    <p className="mt-1 text-sm font-bold text-foreground">
                      Orden #{receipt.orderNumber}
                    </p>
                  </div>

                  <p className="text-sm font-black text-foreground">
                    {formatMoney(receipt.total)}
                  </p>
                </div>

                <p className="mt-2 text-xs font-semibold text-muted-foreground">
                  Emitido: {formatDateTime(receipt.issuedAt)}
                  {receipt.emailedAt ? " · Enviado por email" : ""}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyPanelMessage
            title="Sin recibos emitidos"
            description="Cuando una orden de este vehículo tenga un recibo, va a quedar disponible desde esta ficha."
          />
        )}
      </div>
    </article>
  );
}

function VehicleEventsPanel({ events }: { events: VehicleProfileEvent[] }) {
  return (
    <section className="space-y-4" aria-labelledby="vehicle-events-heading">
      <SectionHeading
        headingId="vehicle-events-heading"
        title="Eventos recientes"
        description="Trazabilidad de acciones sensibles realizadas sobre esta ficha."
        count={`${events.length} evento${events.length === 1 ? "" : "s"}`}
      />

      {events.length > 0 ? (
        <div className="grid gap-3">
          {events.map((event) => (
            <article
              key={event.id}
              className="rounded-[1.1rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:rounded-[1.35rem] sm:p-5"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted text-primary">
                  <History className="size-5" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-primary">
                        {formatVehicleEventType(event.type)}
                      </p>

                      <p className="mt-2 wrap-anywhere text-sm font-semibold leading-6 text-foreground">
                        {event.description ?? "Sin descripción registrada"}
                      </p>
                    </div>

                    <p className="shrink-0 text-xs font-bold text-muted-foreground">
                      {formatDateTime(event.createdAt)}
                    </p>
                  </div>

                  {event.user ? (
                    <p className="mt-2 text-xs font-semibold text-muted-foreground">
                      Usuario: {event.user.name}
                    </p>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyPanelMessage
          title="Sin eventos recientes"
          description="Las acciones de archivado o restauración aparecerán en esta sección."
        />
      )}
    </section>
  );
}

function PanelHeader({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 border-b border-border p-5 sm:p-6">
      <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted text-primary">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
          {eyebrow}
        </p>

        <h2 className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground">
          {title}
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function SmallDatum({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2">
      <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function EmptyPanelMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong bg-surface-muted/55 p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border bg-surface text-muted-foreground">
          <Wrench className="size-5" aria-hidden="true" />
        </div>

        <div>
          <p className="font-display text-base font-black uppercase tracking-[0.04em] text-foreground">
            {title}
          </p>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

type SectionHeadingProps = {
  headingId: string;
  title: string;
  description: string;
  count: string;
};

/**
 * Shared heading block for vehicle-related operational sections.
 */
function SectionHeading({
  headingId,
  title,
  description,
  count,
}: SectionHeadingProps) {
  return (
    <div className="rounded-[1.1rem] border border-border bg-surface/90 p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:rounded-[1.35rem] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Ficha del vehículo
          </p>

          <h2
            id={headingId}
            className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
          >
            {title}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>

        <p className="inline-flex w-fit items-center gap-2 rounded-full border border-border-strong bg-surface-muted px-4 py-2 text-sm font-bold text-foreground">
          <TriangleAlert className="size-4 shrink-0 text-primary" aria-hidden="true" />
          {count}
        </p>
      </div>
    </div>
  );
}

function getVehicleReceipts(
  profile: VehicleProfile,
): VehicleProfileReceiptWithContext[] {
  if (profile.recentReceipts?.length) {
    return profile.recentReceipts;
  }

  return [...(profile.activeWorkOrders ?? []), ...(profile.history ?? [])]
    .flatMap((workOrder) =>
      (workOrder.receipts ?? []).map((receipt) => ({
        ...receipt,
        workOrderId: workOrder.id,
        orderNumber: workOrder.orderNumber,
      })),
    )
    .sort((firstReceipt, secondReceipt) =>
      secondReceipt.issuedAt.localeCompare(firstReceipt.issuedAt),
    )
    .slice(0, 5);
}

function formatAppointmentStatus(status: VehicleAppointmentStatus): string {
  const labels: Record<VehicleAppointmentStatus, string> = {
    SCHEDULED: "Pendiente",
    CONFIRMED: "Confirmado",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
  };

  return labels[status] ?? status;
}

function formatVehicleEventType(eventType: VehicleProfileEvent["type"]): string {
  const labels: Record<VehicleProfileEvent["type"], string> = {
    ARCHIVED: "Archivado",
    RESTORED: "Restaurado",
  };

  return labels[eventType] ?? eventType;
}
