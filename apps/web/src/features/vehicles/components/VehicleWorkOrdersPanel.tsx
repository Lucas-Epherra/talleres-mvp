import Link from "next/link";
import {
  formatDate,
  formatMileage,
  formatMoney,
  formatWorkOrderStatus,
  type WorkOrderStatus,
} from "../../../lib/format";
import {
  DetailSheet,
  DetailSheetRow,
} from "../../../components/ui/DetailSheet";
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
    <section className="overflow-hidden rounded-3xl border border-border bg-surface/85 shadow-(--shadow-industrial) ring-1 ring-white/3">
      <div className="flex flex-col gap-3 border-b border-border p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Órdenes de trabajo
          </p>

          <h2 className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-white">
            {title}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>

        <p className="inline-flex w-fit rounded-full border border-border-strong bg-background/60 px-4 py-2 text-sm font-bold text-white">
          {workOrders.length} orden{workOrders.length === 1 ? "" : "es"}
        </p>
      </div>

      {workOrders.length > 0 ? (
        <div className="divide-y divide-border">
          {workOrders.map((workOrder) => {
            const isDelivered = workOrder.status === "DELIVERED";

            return (
              <article key={workOrder.id} className="p-6">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
                  <div className="min-w-0 space-y-5">
                    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-primary">
                          Orden #{workOrder.orderNumber}
                        </p>

                        <h3 className="mt-2 wrap-break-word font-display text-xl font-black uppercase tracking-[0.02em] text-white">
                          {workOrder.reportedIssue}
                        </h3>
                      </div>

                      <StatusBadge status={workOrder.status} />
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
                        className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-[0_14px_35px_rgba(214,40,40,0.22)] transition hover:bg-primary-hover sm:w-auto"
                      >
                        Ver orden
                      </Link>

                      {!isDelivered ? (
                        <Link
                          href={`/work-orders/${workOrder.id}/edit`}
                          className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated sm:w-auto"
                        >
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
                      value={formatWorkOrderStatus(workOrder.status)}
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
        <div className="p-6">
          <p className="rounded-2xl border border-dashed border-border-strong bg-background/45 p-6 text-sm leading-6 text-muted-foreground">
            {emptyMessage}
          </p>
        </div>
      )}
    </section>
  );
}

type StatusBadgeProps = {
  status: WorkOrderStatus;
};

/**
 * Renders a compact visual status badge for a work order.
 */
function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`${getStatusBadgeClassName(status)} inline-flex w-fit shrink-0 rounded-full border px-4 py-2 text-sm font-bold`}
    >
      {formatWorkOrderStatus(status)}
    </span>
  );
}

/**
 * Maps order status to branded badge classes.
 */
function getStatusBadgeClassName(status: WorkOrderStatus): string {
  if (status === "IN_PROGRESS") {
    return "border-primary/40 bg-primary/10 text-white";
  }

  if (status === "READY") {
    return "border-warning/40 bg-warning/10 text-white";
  }

  if (status === "DELIVERED") {
    return "border-border-strong bg-background/60 text-muted-foreground";
  }

  return "border-border-strong bg-surface-muted text-white";
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