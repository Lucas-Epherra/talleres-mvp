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
  ReceiptText,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ApiError } from "../../../../lib/api";
import {
  formatDate,
  formatMileage,
  formatMoney,
  formatWorkOrderStatus,
} from "../../../../lib/format";
import { UpdateWorkOrderStatusForm } from "../../../../features/work-orders/components/UpdateWorkOrderStatusForm";
import { getPaginatedAppointments } from "../../../../features/appointments/appointments.server";
import { IssueReceiptButton } from "../../../../features/receipts/components/IssueReceiptButton";
import { getReceipts } from "../../../../features/receipts/receipts.server";
import { WorkOrderAppointmentsPanel } from "../../../../features/work-orders/components/WorkOrderAppointmentsPanel";
import { WorkOrderStructuredPartsPanel } from "../../../../features/work-orders/components/WorkOrderStructuredPartsPanel";
import { ReopenWorkOrderForm } from "../../../../features/work-orders/components/ReopenWorkOrderForm";
import { CancelWorkOrderForm } from "../../../../features/work-orders/components/CancelWorkOrderForm";
import {
  BreakableDetailValue,
  WorkOrderNotesValue,
  WorkOrderPartsValue,
} from "../../../../features/work-orders/components/WorkOrderDetailValues";
import { getWorkOrder } from "../../../../features/work-orders/work-orders.server";
import type { WorkOrder } from "../../../../features/work-orders/types";

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
  const [workOrder, linkedAppointmentsPage, receiptsPage] = await Promise.all([
    getWorkOrderOrNotFound(resolvedParams.id),
    getPaginatedAppointments({
      workOrderId: resolvedParams.id,
      limit: 50,
    }),
    getReceipts({
      workOrderId: resolvedParams.id,
      limit: 1,
    }),
  ]);

  const { vehicle } = workOrder;
  const customer = vehicle.customer;
  const isDelivered = workOrder.status === "DELIVERED";
  const isCancelled = workOrder.status === "CANCELLED";
  const isClosed = isDelivered || isCancelled;
  const issuedReceipt = receiptsPage.data[0] ?? null;
  const partLines = workOrder.partLines ?? [];
  const hasStructuredPartLines = partLines.length > 0;

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

          {issuedReceipt ? (
            <Link
              href={`/receipts/${issuedReceipt.id}`}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover sm:w-auto"
            >
              <ReceiptText className="size-4 shrink-0" aria-hidden="true" />
              Ver recibo
            </Link>
          ) : !isCancelled ? (
            <IssueReceiptButton workOrderId={workOrder.id} />
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

      <WorkOrderTechnicalSheet
        workOrder={workOrder}
        vehicle={vehicle}
        customer={customer}
        hasStructuredPartLines={hasStructuredPartLines}
      />

      {hasStructuredPartLines ? (
        <WorkOrderStructuredPartsPanel partLines={partLines} />
      ) : null}

      <section
        aria-labelledby="work-order-receipt-heading"
        className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted text-primary">
              <ReceiptText className="size-5" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                Cobro
              </p>

              <h2
                id="work-order-receipt-heading"
                className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
              >
                Recibo interno
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Generá un comprobante interno tipo talonario con los datos actuales de
                la orden. No reemplaza factura ni documentación fiscal.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {issuedReceipt ? (
              <Link
                href={`/receipts/${issuedReceipt.id}`}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover sm:w-auto"
              >
                <ReceiptText className="size-4 shrink-0" aria-hidden="true" />
                Ver recibo
              </Link>
            ) : !isCancelled ? (
              <IssueReceiptButton workOrderId={workOrder.id} />
            ) : (
              <p className="rounded-2xl border border-border-strong bg-surface-muted px-4 py-3 text-sm font-semibold text-muted-foreground">
                Las órdenes anuladas no pueden emitir recibo.
              </p>
            )}
          </div>
        </div>

        {issuedReceipt ? (
          <p className="mt-5 rounded-2xl border border-border-strong bg-surface-muted px-4 py-3 text-sm font-semibold leading-6 text-foreground">
            Esta orden ya tiene un recibo interno emitido. Para conservar trazabilidad,
            el recibo queda como snapshot y no se modifica aunque la orden cambie.
          </p>
        ) : null}
      </section>

      <WorkOrderAppointmentsPanel
        workOrder={workOrder}
        appointments={linkedAppointmentsPage.data}
      />

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

      <WorkOrderTimeline events={workOrder.events ?? []} />

      <WorkOrderCriticalZone
        workOrderId={workOrder.id}
        isClosed={isClosed}
        isDelivered={isDelivered}
        isCancelled={isCancelled}
      />
    </section>
  );
}

type WorkOrderTechnicalSheetProps = {
  workOrder: WorkOrder;
  vehicle: WorkOrder["vehicle"];
  customer: WorkOrder["vehicle"]["customer"];
  hasStructuredPartLines: boolean;
};

/**
 * Unified operational sheet for the work order.
 *
 * Related technical, vehicle, financial and customer data share one container
 * so workshop administrators can scan the record as a single document.
 */
function WorkOrderTechnicalSheet({
  workOrder,
  vehicle,
  customer,
  hasStructuredPartLines,
}: WorkOrderTechnicalSheetProps) {
  return (
    <section
      aria-labelledby="work-order-technical-sheet-heading"
      className="overflow-hidden rounded-[1.35rem] border border-border bg-surface shadow-(--shadow-industrial) ring-1 ring-white/3"
    >
      <header className="flex flex-col gap-4 border-b border-border bg-linear-to-r from-surface via-surface to-surface-elevated px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted text-primary">
            <ClipboardCheck className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              Ficha técnica
            </p>

            <h2
              id="work-order-technical-sheet-heading"
              className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
            >
              Ficha operativa de la orden
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Información técnica, vehículo, cliente, fechas y valores reunidos
              en una única ficha de consulta.
            </p>
          </div>
        </div>

        <p className="inline-flex w-fit shrink-0 items-center rounded-full border border-border-strong bg-surface-muted px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Orden #{workOrder.orderNumber}
        </p>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
        <TechnicalSheetSection
          eyebrow="Trabajo operativo"
          title="Información del trabajo"
          className="border-b border-border lg:border-r"
        >
          <TechnicalSheetRow
            label="Problema reportado"
            value={workOrder.reportedIssue}
          />
          <TechnicalSheetRow
            label="Diagnóstico"
            value={getReadableText(
              workOrder.diagnosis,
              "Diagnóstico pendiente",
            )}
          />
          <TechnicalSheetRow
            label="Trabajo realizado"
            value={getReadableText(workOrder.workDone, "Trabajo pendiente")}
          />
          {!hasStructuredPartLines ? (
            <TechnicalSheetRow
              label="Repuestos usados"
              value={
                <WorkOrderPartsValue
                  value={workOrder.partsUsed}
                  fallback="Sin repuestos cargados"
                />
              }
            />
          ) : null}
          <TechnicalSheetRow
            label="Notas"
            value={
              <WorkOrderNotesValue
                value={workOrder.notes}
                fallback="Sin notas internas"
              />
            }
            last
          />
        </TechnicalSheetSection>

        <TechnicalSheetSection
          eyebrow="Activo asociado"
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
          className="border-b border-border"
        >
          <TechnicalSheetRow label="Patente" value={vehicle.licensePlate} />
          <TechnicalSheetRow label="Marca" value={vehicle.brand} />
          <TechnicalSheetRow label="Modelo" value={vehicle.model} />
          <TechnicalSheetRow
            label="Año"
            value={vehicle.year ? vehicle.year.toString() : "Sin cargar"}
          />
          <TechnicalSheetRow
            label="Kilometraje"
            value={formatMileage(vehicle.mileage)}
            last
          />
        </TechnicalSheetSection>

        <TechnicalSheetSection
          eyebrow="Control económico"
          title="Fechas, kilometraje y costos"
          className="border-b border-border lg:border-b-0 lg:border-r"
        >
          <TechnicalSheetRow
            label="Ingreso"
            value={formatDate(workOrder.entryDate)}
          />
          <TechnicalSheetRow
            label="Entrega"
            value={formatDate(workOrder.deliveryDate)}
          />
          <TechnicalSheetRow
            label="Km ingreso"
            value={formatMileage(workOrder.entryMileage)}
          />
          <TechnicalSheetRow
            label="Mano de obra"
            value={formatMoney(workOrder.laborCost)}
          />
          <TechnicalSheetRow
            label="Repuestos al cliente"
            value={formatMoney(workOrder.partsCost)}
          />
          <TechnicalSheetRow
            label="Total final"
            value={formatMoney(workOrder.finalTotal)}
            emphasis
            last
          />
        </TechnicalSheetSection>

        <TechnicalSheetSection
          eyebrow="Responsable de la orden"
          title="Cliente asociado"
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
          <TechnicalSheetRow label="Nombre" value={customer.fullName} />
          <TechnicalSheetRow
            label="Teléfono"
            value={customer.phone ?? "Sin teléfono"}
          />
          <TechnicalSheetRow
            label="Email"
            value={
              <BreakableDetailValue value={customer.email ?? "Sin email"} />
            }
            last
          />
        </TechnicalSheetSection>
      </div>
    </section>
  );
}

type TechnicalSheetSectionProps = {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * One semantic area inside the unified technical sheet.
 */
function TechnicalSheetSection({
  eyebrow,
  title,
  action,
  className,
  children,
}: TechnicalSheetSectionProps) {
  return (
    <section className={className}>
      <div className="flex min-h-20 flex-col gap-3 border-b border-border bg-surface-elevated/35 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
          <h3 className="mt-1.5 font-display text-base font-black uppercase tracking-[0.04em] text-foreground">
            {title}
          </h3>
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <dl>{children}</dl>
    </section>
  );
}

type TechnicalSheetRowProps = {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
  last?: boolean;
};

/**
 * Planilla-style label/value row used throughout the technical sheet.
 */
function TechnicalSheetRow({
  label,
  value,
  emphasis = false,
  last = false,
}: TechnicalSheetRowProps) {
  return (
    <div
      className={`grid min-h-12 grid-cols-[minmax(8.5rem,0.36fr)_minmax(0,1fr)] ${
        last ? "" : "border-b border-border"
      }`}
    >
      <dt
        className={`flex items-center bg-surface-muted/55 px-4 py-3 text-[0.62rem] font-bold uppercase tracking-[0.18em] sm:px-5 ${
          emphasis ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {label}
      </dt>

      <dd
        className={`min-w-0 px-4 py-3 text-sm leading-6 sm:px-5 ${
          emphasis
            ? "bg-primary/5 font-black text-foreground"
            : "font-medium text-foreground"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

type WorkOrderCriticalZoneProps = {
  workOrderId: string;
  isClosed: boolean;
  isDelivered: boolean;
  isCancelled: boolean;
};

/**
 * Groups destructive or exceptional work order actions at the end of the page.
 *
 * Keeping cancellation and reopening away from the primary operational content
 * makes the detail page easier to scan and avoids exposing critical actions as
 * if they were part of the daily flow.
 */
function WorkOrderCriticalZone({
  workOrderId,
  isClosed,
  isDelivered,
  isCancelled,
}: WorkOrderCriticalZoneProps) {
  const badgeLabel = getCriticalZoneBadgeLabel({
    isClosed,
    isDelivered,
    isCancelled,
  });

  return (
    <section
      aria-labelledby="work-order-critical-zone-heading"
      className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3"
    >
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-warning/40 bg-warning/10 text-warning">
            <Ban className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-warning">
              Zona crítica
            </p>

            <h2
              id="work-order-critical-zone-heading"
              className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
            >
              Acciones sensibles
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Usá esta zona solo para anular una orden, corregir un cierre o
              revisar por qué quedó fuera del flujo operativo.
            </p>
          </div>
        </div>

        <p className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-border-strong bg-surface-muted px-4 py-2 text-sm font-bold text-foreground">
          {badgeLabel}
        </p>
      </div>

      {!isClosed ? (
        <div className="mt-5">
          <CriticalZoneIntro
            icon="cancel"
            eyebrow="Cierre administrativo"
            title="Anular orden"
            description="Usá esta acción cuando la orden fue cargada por error, el cliente no autorizó el trabajo o el servicio no continuará. La anulación exige motivo y queda registrada en el historial."
          />

          <CancelWorkOrderForm workOrderId={workOrderId} />
        </div>
      ) : null}

      {isDelivered ? (
        <div className="mt-5">
          <CriticalZoneIntro
            icon="reopen"
            eyebrow="Orden entregada"
            title="Corrección controlada"
            description="Esta orden está cerrada como entregada. Si fue marcada por error, podés reabrirla dejando un motivo obligatorio en el historial operativo."
          />

          <ReopenWorkOrderForm workOrderId={workOrderId} />
        </div>
      ) : null}

      {isCancelled ? (
        <div className="mt-5">
          <CriticalZoneIntro
            icon="closed"
            eyebrow="Orden anulada"
            title="Flujo cerrado"
            description="Esta orden fue anulada y quedó fuera del flujo operativo. No puede editarse, entregarse ni volver a estados anteriores. Revisá el historial para consultar el motivo registrado."
          />
        </div>
      ) : null}
    </section>
  );
}

type CriticalZoneIntroProps = {
  icon: "cancel" | "reopen" | "closed";
  eyebrow: string;
  title: string;
  description: string;
};

/**
 * Intro block for one critical work order action.
 */
function CriticalZoneIntro({
  icon,
  eyebrow,
  title,
  description,
}: CriticalZoneIntroProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/75 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <div className="flex items-start gap-3">
        <div className={getCriticalZoneIconClassName(icon)}>
          {renderCriticalZoneIcon(icon)}
        </div>

        <div className="min-w-0">
          <p className={getCriticalZoneEyebrowClassName(icon)}>{eyebrow}</p>

          <h3 className="mt-2 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground">
            {title}
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Returns the compact badge displayed in the critical zone header.
 */
function getCriticalZoneBadgeLabel({
  isClosed,
  isDelivered,
  isCancelled,
}: Pick<WorkOrderCriticalZoneProps, "isClosed" | "isDelivered" | "isCancelled">): string {
  if (isCancelled) {
    return "Orden anulada";
  }

  if (isDelivered) {
    return "Corrección disponible";
  }

  if (isClosed) {
    return "Flujo cerrado";
  }

  return "Anulación";
}

/**
 * Renders the critical zone icon without dynamic component references.
 */
function renderCriticalZoneIcon(icon: CriticalZoneIntroProps["icon"]) {
  const iconClassName = "size-5";

  if (icon === "reopen") {
    return <CheckCircle2 className={iconClassName} aria-hidden="true" />;
  }

  return <Ban className={iconClassName} aria-hidden="true" />;
}

/**
 * Maps critical action type to icon container classes.
 */
function getCriticalZoneIconClassName(
  icon: CriticalZoneIntroProps["icon"],
): string {
  const baseClassName =
    "grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface";

  if (icon === "reopen") {
    return `${baseClassName} text-success`;
  }

  if (icon === "closed") {
    return `${baseClassName} text-muted-foreground`;
  }

  return `${baseClassName} text-warning`;
}

/**
 * Maps critical action type to eyebrow classes.
 */
function getCriticalZoneEyebrowClassName(
  icon: CriticalZoneIntroProps["icon"],
): string {
  const baseClassName = "text-[0.68rem] font-bold uppercase tracking-[0.22em]";

  if (icon === "reopen") {
    return `${baseClassName} text-success`;
  }

  if (icon === "closed") {
    return `${baseClassName} text-muted-foreground`;
  }

  return `${baseClassName} text-warning`;
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
  return (
    <li className="rounded-2xl border border-border bg-surface-muted/75 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-border-strong bg-surface-elevated text-primary">
          {renderWorkOrderEventIcon(event.type)}
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
 * Renders the icon for a work order timeline event.
 *
 * This avoids creating a dynamic component reference during render, which is
 * blocked by the React Compiler static-components rule.
 */
function renderWorkOrderEventIcon(type: WorkOrderTimelineItem["type"]) {
  const iconClassName = "size-4";

  switch (type) {
    case "CREATED":
      return <ClipboardCheck className={iconClassName} aria-hidden="true" />;

    case "UPDATED":
      return <FilePenLine className={iconClassName} aria-hidden="true" />;

    case "STATUS_CHANGED":
      return <RefreshCw className={iconClassName} aria-hidden="true" />;

    case "DELIVERED":
      return <CheckCircle2 className={iconClassName} aria-hidden="true" />;

    case "REOPENED":
      return <RefreshCw className={iconClassName} aria-hidden="true" />;

    case "CANCELLED":
      return <Ban className={iconClassName} aria-hidden="true" />;
  }
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