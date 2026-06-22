import { ClipboardList, Eye, Pencil } from "lucide-react";
import Link from "next/link";
import {
  DetailSheet,
  DetailSheetRow,
} from "../../../components/ui/DetailSheet";
import {
  formatDate,
  formatMileage,
  formatMoney,
  formatWorkOrderStatus,
  type WorkOrderStatus,
} from "../../../lib/format";
import { UpdateWorkOrderStatusForm } from "../../work-orders/components/UpdateWorkOrderStatusForm";
import {
  WorkOrderNotesValue,
  WorkOrderPartsValue,
} from "../../work-orders/components/WorkOrderDetailValues";
import type { VehicleProfileWorkOrder } from "../types";

type VehicleWorkOrdersPanelProps = {
  title: string;
  description: string;
  emptyMessage: string;
  workOrders: VehicleProfileWorkOrder[];
};

/**
 * Displays active or historical work orders inside the vehicle profile.
 *
 * Active orders expose direct actions to view, edit and update status.
 * Historical delivered orders keep a read-only detail shortcut. Operational
 * and financial information is grouped into readable sections.
 */
export function VehicleWorkOrdersPanel({
  title,
  description,
  emptyMessage,
  workOrders,
}: VehicleWorkOrdersPanelProps) {
  return (
    <section className="overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated shadow-(--shadow-industrial) ring-1 ring-white/3">
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted text-primary">
            <ClipboardList className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              Órdenes de trabajo
            </p>

            <h2 className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground">
              {title}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <p className="inline-flex w-fit items-center gap-2 rounded-full border border-border-strong bg-surface-muted px-4 py-2 text-sm font-bold text-foreground">
          <ClipboardList
            className="size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          {workOrders.length} orden{workOrders.length === 1 ? "" : "es"}
        </p>
      </div>

      {workOrders.length > 0 ? (
        <div className="divide-y divide-border">
          {workOrders.map((workOrder) => {
            const isDelivered = workOrder.status === "DELIVERED";

            return (
              <article key={workOrder.id} className="p-5 sm:p-6">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-start">
                  <div className="min-w-0 space-y-5">
                    <header className="rounded-2xl border border-border bg-surface-muted/75 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-primary">
                            Orden #{workOrder.orderNumber}
                          </p>

                          <h3 className="mt-2 wrap-anywhere font-display text-xl font-black uppercase tracking-[0.02em] text-foreground">
                            {workOrder.reportedIssue}
                          </h3>
                        </div>

                        <StatusIndicator status={workOrder.status} />
                      </div>
                    </header>

                    <DetailSheet
                      headingId={`vehicle-work-order-work-${workOrder.id}`}
                      title="Información del trabajo"
                      titleSize="sm"
                    >
                      <DetailSheetRow
                        label="Diagnóstico"
                        value={getReadableText(
                          workOrder.diagnosis,
                          "Diagnóstico pendiente",
                        )}
                      />

                      <DetailSheetRow
                        label="Trabajo realizado"
                        value={getReadableText(
                          workOrder.workDone,
                          "Trabajo pendiente",
                        )}
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

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <Link
                        href={`/work-orders/${workOrder.id}`}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-hover sm:w-auto"
                      >
                        <Eye className="size-4 shrink-0" aria-hidden="true" />
                        Ver orden
                      </Link>

                      {!isDelivered ? (
                        <Link
                          href={`/work-orders/${workOrder.id}/edit`}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated sm:w-auto"
                        >
                          <Pencil
                            className="size-4 shrink-0"
                            aria-hidden="true"
                          />
                          Editar orden
                        </Link>
                      ) : null}
                    </div>

                    {!isDelivered ? (
                      <UpdateWorkOrderStatusForm
                        workOrderId={workOrder.id}
                        currentStatus={workOrder.status}
                      />
                    ) : null}
                  </div>

                  <DetailSheet
                    headingId={`vehicle-work-order-details-${workOrder.id}`}
                    title="Datos de la orden"
                    titleSize="sm"
                    className="h-fit xl:self-start"
                  >
                    <DetailSheetRow
                      label="Estado"
                      value={<StatusText status={workOrder.status} />}
                    />

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
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="p-5 sm:p-6">
          <p className="rounded-2xl border border-dashed border-border-strong bg-surface-muted/65 p-6 text-sm leading-6 text-muted-foreground">
            {emptyMessage}
          </p>
        </div>
      )}
    </section>
  );
}

type StatusIndicatorProps = {
  status: WorkOrderStatus;
};

/**
 * Renders a non-interactive work order status indicator.
 *
 * It intentionally avoids pill borders/backgrounds so users do not confuse the
 * status with an actionable button.
 */
function StatusIndicator({ status }: StatusIndicatorProps) {
  const classes = getStatusIndicatorClasses(status);

  return (
    <div
      className={`${classes.text} inline-flex w-fit shrink-0 items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.16em]`}
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
 * Renders plain status text inside detail sheets.
 */
function StatusText({ status }: StatusIndicatorProps) {
  const classes = getStatusIndicatorClasses(status);

  return (
    <span className={`${classes.text} font-bold`}>
      {formatWorkOrderStatus(status)}
    </span>
  );
}

/**
 * Maps work order statuses to non-clickable status indicator classes.
 */
function getStatusIndicatorClasses(status: WorkOrderStatus): {
  text: string;
  dot: string;
} {
  const statusClassMap: Record<
    WorkOrderStatus,
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
  };

  return statusClassMap[status];
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
