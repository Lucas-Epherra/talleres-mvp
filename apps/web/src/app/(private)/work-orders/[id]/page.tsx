import {
  ArrowLeft,
  Ban,
  CarFront,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FilePenLine,
  History,
  ListChecks,
  Pencil,
  RefreshCw,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ApiError } from "../../../../lib/api";
import {
  formatDate,
  formatMileage,
  formatMoney,
  formatWorkOrderStatus,
} from "../../../../lib/format";
import { UpdateWorkOrderStatusForm } from "../../../../features/work-orders/components/UpdateWorkOrderStatusForm";
import { ReopenWorkOrderForm } from "../../../../features/work-orders/components/ReopenWorkOrderForm";
import { CancelWorkOrderForm } from "../../../../features/work-orders/components/CancelWorkOrderForm";
import {
  BreakableDetailValue,
  WorkOrderNotesValue,
  WorkOrderPartsValue,
} from "../../../../features/work-orders/components/WorkOrderDetailValues";
import { getWorkOrder } from "../../../../features/work-orders/work-orders.server";
import type { WorkOrder } from "../../../../features/work-orders/types";
import {
  DetailSheet,
  DetailSheetRow,
} from "../../../../components/ui/DetailSheet";

type WorkOrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Detalle de orden",
};

/**
 * Work order detail page.
 *
 * This screen centralizes the operational information of one order and reuses
 * the status mutation form already used from the vehicle profile.
 */
export default async function WorkOrderDetailPage({
  params,
}: WorkOrderDetailPageProps) {
  const resolvedParams = await params;
  const workOrder = await getWorkOrderOrNotFound(resolvedParams.id);
  const { vehicle } = workOrder;
  const customer = vehicle.customer;
  const isDelivered = workOrder.status === "DELIVERED";
  const isCancelled = workOrder.status === "CANCELLED";
  const isClosed = isDelivered || isCancelled;

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              href="/work-orders"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-hover"
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
              Volver a órdenes
            </Link>

            <p className="mt-6 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              Orden #{workOrder.orderNumber}
            </p>

            <h1 className="mt-3 wrap-anywhere font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
              {workOrder.reportedIssue}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Detalle operativo de la orden, vehículo asociado, cliente, costos,
              kilometraje y estado actual.
            </p>
          </div>

          <div className="shrink-0 lg:pt-10">
            <StatusIndicator status={workOrder.status} />
          </div>
        </div>

        <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {!isClosed ? (
            <Link
              href={`/work-orders/${workOrder.id}/edit`}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover sm:w-auto"
            >
              <Pencil className="size-4 shrink-0" aria-hidden="true" />
              Editar orden
            </Link>
          ) : null}

          <Link
            href={`/vehicles/${vehicle.id}`}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated sm:w-auto"
          >
            <CarFront className="size-4 shrink-0" aria-hidden="true" />
            Ver ficha del vehículo
          </Link>

          <Link
            href="/work-orders"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated sm:w-auto"
          >
            <ListChecks className="size-4 shrink-0" aria-hidden="true" />
            Ver todas las órdenes
          </Link>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div className="min-w-0 space-y-6">
          <DetailSheet
            headingId="work-order-description-heading"
            title="Información del trabajo"
          >
            <DetailSheetRow
              label="Problema reportado"
              value={workOrder.reportedIssue}
            />

            <DetailSheetRow
              label="Diagnóstico"
              value={getReadableText(
                workOrder.diagnosis,
                "Diagnóstico pendiente",
              )}
            />

            <DetailSheetRow
              label="Trabajo realizado"
              value={getReadableText(workOrder.workDone, "Trabajo pendiente")}
            />

            <DetailSheetRow
              label="Repuestos usados"
              value={
                <WorkOrderPartsValue
                  value={workOrder.partsUsed}
                  fallback="Sin repuestos cargados"
                />
              }
            />

            <DetailSheetRow
              label="Notas"
              value={
                <WorkOrderNotesValue
                  value={workOrder.notes}
                  fallback="Sin notas internas"
                />
              }
            />
          </DetailSheet>

          <DetailSheet
            headingId="work-order-costs-heading"
            title="Fechas, kilometraje y costos"
          >
            <DetailSheetRow
              label="Ingreso"
              value={formatDate(workOrder.entryDate)}
            />

            <DetailSheetRow
              label="Entrega"
              value={formatDate(workOrder.deliveryDate)}
            />

            <DetailSheetRow
              label="Km ingreso"
              value={formatMileage(workOrder.entryMileage)}
            />

            <DetailSheetRow
              label="Mano de obra"
              value={formatMoney(workOrder.laborCost)}
            />

            <DetailSheetRow
              label="Repuestos"
              value={formatMoney(workOrder.partsCost)}
            />

            <DetailSheetRow
              label="Total final"
              value={formatMoney(workOrder.finalTotal)}
            />
          </DetailSheet>

          {!isClosed ? (
            <section
              aria-labelledby="work-order-status-heading"
              className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3"
            >
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted text-primary">
                  <ListChecks className="size-5" aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                    Flujo operativo
                  </p>

                  <h2
                    id="work-order-status-heading"
                    className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
                  >
                    Actualizar estado
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Cambiá el estado de la orden cuando el trabajo avance dentro
                    del taller.
                  </p>
                </div>
              </div>

              <UpdateWorkOrderStatusForm
                workOrderId={workOrder.id}
                currentStatus={workOrder.status}
              />
            </section>
          ) : null}
          {!isClosed ? (
            <section
              aria-labelledby="work-order-cancel-heading"
              className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3"
            >
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted text-primary">
                  <Ban className="size-5" aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                    Cierre administrativo
                  </p>

                  <h2
                    id="work-order-cancel-heading"
                    className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
                  >
                    Anular orden
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Usá esta acción cuando la orden fue cargada por error, el
                    cliente no autorizó el trabajo o el servicio no continuará.
                    La anulación exige motivo y queda registrada en el
                    historial.
                  </p>
                </div>
              </div>

              <CancelWorkOrderForm workOrderId={workOrder.id} />
            </section>
          ) : null}
          {isDelivered ? (
            <section
              aria-labelledby="work-order-reopen-heading"
              className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3"
            >
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted text-success">
                  <CheckCircle2 className="size-5" aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-success">
                    Orden entregada
                  </p>

                  <h2
                    id="work-order-reopen-heading"
                    className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
                  >
                    Corrección controlada
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Esta orden está cerrada como entregada. Si fue marcada por
                    error, podés reabrirla dejando un motivo obligatorio en el
                    historial operativo.
                  </p>
                </div>
              </div>

              <ReopenWorkOrderForm workOrderId={workOrder.id} />
            </section>
          ) : null}
          {isCancelled ? (
            <section
              aria-labelledby="work-order-cancelled-heading"
              className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3"
            >
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted text-muted-foreground">
                  <Ban className="size-5" aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                    Orden anulada
                  </p>

                  <h2
                    id="work-order-cancelled-heading"
                    className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
                  >
                    Flujo cerrado
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Esta orden fue anulada y quedó fuera del flujo operativo. No
                    puede editarse, entregarse ni volver a estados anteriores.
                    Revisá el historial para consultar el motivo registrado.
                  </p>
                </div>
              </div>
            </section>
          ) : null}
          <WorkOrderTimeline events={workOrder.events ?? []} />
        </div>

        <aside className="min-w-0 space-y-6 xl:h-fit xl:self-start">
          <DetailSheet
            headingId="work-order-vehicle-heading"
            title="Vehículo"
            action={
              <Link
                href={`/vehicles/${vehicle.id}`}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary transition hover:text-primary-hover"
              >
                <CarFront className="size-3.5 shrink-0" aria-hidden="true" />
                Abrir ficha
              </Link>
            }
          >
            <DetailSheetRow label="Patente" value={vehicle.licensePlate} />
            <DetailSheetRow label="Marca" value={vehicle.brand} />
            <DetailSheetRow label="Modelo" value={vehicle.model} />
            <DetailSheetRow
              label="Año"
              value={vehicle.year ? vehicle.year.toString() : "Sin cargar"}
            />
            <DetailSheetRow
              label="Kilometraje"
              value={formatMileage(vehicle.mileage)}
            />
          </DetailSheet>

          <DetailSheet
            headingId="work-order-customer-heading"
            title="Cliente"
            action={
              <Link
                href={`/customers/${customer.id}`}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary transition hover:text-primary-hover"
              >
                <UserRound className="size-3.5 shrink-0" aria-hidden="true" />
                Ver cliente
              </Link>
            }
          >
            <DetailSheetRow label="Nombre" value={customer.fullName} />

            <DetailSheetRow
              label="Teléfono"
              value={customer.phone ?? "Sin teléfono"}
            />

            <DetailSheetRow
              label="Email"
              value={
                <BreakableDetailValue value={customer.email ?? "Sin email"} />
              }
            />
          </DetailSheet>
        </aside>
      </div>
    </section>
  );
}

type WorkOrderTimelineProps = {
  events: NonNullable<WorkOrder["events"]>;
};

type WorkOrderTimelineItem = NonNullable<WorkOrder["events"]>[number];

/**
 * Renders the immutable operational history of a work order.
 */
function WorkOrderTimeline({ events }: WorkOrderTimelineProps) {
  return (
    <section
      aria-labelledby="work-order-timeline-heading"
      className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3"
    >
      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted text-primary">
            <History className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              Historial
            </p>

            <h2
              id="work-order-timeline-heading"
              className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
            >
              Historial operativo
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Registro de creación, ediciones y cambios de estado realizados
              sobre esta orden.
            </p>
          </div>
        </div>

        <p className="inline-flex w-fit items-center gap-2 rounded-full border border-border-strong bg-surface-muted px-4 py-2 text-sm font-bold text-foreground">
          <History
            className="size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          {events.length} evento{events.length === 1 ? "" : "s"}
        </p>
      </div>

      {events.length > 0 ? (
        <ol className="mt-5 space-y-3">
          {events.map((event) => (
            <TimelineEvent key={event.id} event={event} />
          ))}
        </ol>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed border-border-strong bg-surface-muted/65 p-5 text-sm leading-6 text-muted-foreground">
          Todavía no hay eventos registrados para esta orden.
        </p>
      )}
    </section>
  );
}

/**
 * Renders one audit event row inside the operational timeline.
 */
function TimelineEvent({ event }: { event: WorkOrderTimelineItem }) {
  const Icon = getWorkOrderEventIcon(event.type);

  return (
    <li className="rounded-2xl border border-border bg-surface-muted/75 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-border-strong bg-surface-elevated text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-black text-foreground">
                {getWorkOrderEventTitle(event.type)}
              </p>

              <p className="mt-1 wrap-anywhere text-sm leading-6 text-muted-foreground">
                {event.description ?? getWorkOrderEventFallback(event.type)}
              </p>
            </div>

            <p className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3 py-1 text-xs font-bold text-muted-foreground">
              <Clock3 className="size-3.5" aria-hidden="true" />
              {formatWorkOrderEventDateTime(event.createdAt)}
            </p>
          </div>

          {event.fromStatus && event.toStatus ? (
            <p className="mt-3 w-fit rounded-full border border-border-strong bg-surface px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-foreground">
              {formatWorkOrderStatus(event.fromStatus)} →{" "}
              {formatWorkOrderStatus(event.toStatus)}
            </p>
          ) : null}

          <p className="mt-3 text-xs font-semibold text-muted-foreground">
            Usuario:{" "}
            <span className="font-bold text-foreground">
              {event.user?.name ?? "Usuario eliminado"}
            </span>
          </p>
        </div>
      </div>
    </li>
  );
}

/**
 * Maps audit event types to visual icons.
 */
function getWorkOrderEventIcon(
  type: WorkOrderTimelineItem["type"],
): LucideIcon {
  const iconMap: Record<WorkOrderTimelineItem["type"], LucideIcon> = {
    CREATED: ClipboardCheck,
    UPDATED: FilePenLine,
    STATUS_CHANGED: RefreshCw,
    DELIVERED: CheckCircle2,
    REOPENED: RefreshCw,
    CANCELLED: Ban,
  };

  return iconMap[type];
}

/**
 * Maps audit event types to readable titles.
 */
function getWorkOrderEventTitle(type: WorkOrderTimelineItem["type"]): string {
  const titleMap: Record<WorkOrderTimelineItem["type"], string> = {
    CREATED: "Orden creada",
    UPDATED: "Información actualizada",
    STATUS_CHANGED: "Cambio de estado",
    DELIVERED: "Orden entregada",
    REOPENED: "Orden reabierta",
    CANCELLED: "Orden anulada",
  };

  return titleMap[type];
}

/**
 * Returns a safe fallback when older events do not have a description.
 */
function getWorkOrderEventFallback(
  type: WorkOrderTimelineItem["type"],
): string {
  const fallbackMap: Record<WorkOrderTimelineItem["type"], string> = {
    CREATED: "Se creó la orden de trabajo.",
    UPDATED: "Se actualizó la información operativa de la orden.",
    STATUS_CHANGED: "Se modificó el estado operativo de la orden.",
    DELIVERED: "La orden fue marcada como entregada.",
    REOPENED: "La orden fue reabierta con trazabilidad operativa.",
    CANCELLED: "La orden fue anulada con motivo registrado.",
  };

  return fallbackMap[type];
}

/**
 * Formats audit timestamps with date and time for operational traceability.
 */
function formatWorkOrderEventDateTime(value: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

/**
 * Fetches a work order and converts backend 404 responses into Next notFound.
 */
async function getWorkOrderOrNotFound(workOrderId: string): Promise<WorkOrder> {
  try {
    return await getWorkOrder(workOrderId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}

/**
 * Converts nullable or empty API text into a readable fallback.
 */
function getReadableText(value: string | null, fallback: string): string {
  if (!value || value.trim().length === 0) {
    return fallback;
  }

  return value;
}

type StatusIndicatorProps = {
  status: WorkOrder["status"];
};

/**
 * Renders a non-button visual status indicator for the work order header.
 */
function StatusIndicator({ status }: StatusIndicatorProps) {
  const classes = getStatusIndicatorClasses(status);

  return (
    <div
      className={`${classes.text} inline-flex w-fit items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.16em]`}
      aria-label={`Estado: ${formatWorkOrderStatus(status)}`}
    >
      <span
        aria-hidden="true"
        className={`${classes.dot} size-2 rounded-full`}
      />

      <span>Estado: {formatWorkOrderStatus(status)}</span>
    </div>
  );
}

/**
 * Maps work order statuses to readable light-mode status indicator classes.
 */
function getStatusIndicatorClasses(status: WorkOrder["status"]): {
  text: string;
  dot: string;
} {
  const statusClassMap: Record<
    WorkOrder["status"],
    {
      text: string;
      dot: string;
    }
  > = {
    PENDING: {
      text: "text-muted-foreground",
      dot: "bg-steel text-steel",
    },
    IN_PROGRESS: {
      text: "text-primary",
      dot: "bg-primary text-primary",
    },
    READY: {
      text: "text-warning",
      dot: "bg-warning text-warning",
    },
    DELIVERED: {
      text: "text-success",
      dot: "bg-success text-success",
    },
    CANCELLED: {
      text: "text-muted-foreground",
      dot: "bg-muted-foreground text-muted-foreground",
    },
  };

  return statusClassMap[status];
}
