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

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div
          aria-hidden="true"
          className="absolute right-0 top-0 h-40 w-40 translate-x-14 -translate-y-16 rounded-full bg-primary/10 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-24 w-48 -translate-x-16 translate-y-12 rounded-full bg-carbon/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              href="/work-orders"
              className="text-sm font-bold text-primary transition hover:text-primary-hover"
            >
              ← Volver a órdenes
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
          <Link
            href={`/work-orders/${workOrder.id}/edit`}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover sm:w-auto"
          >
            Editar orden
          </Link>

          <Link
            href={`/vehicles/${vehicle.id}`}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated sm:w-auto"
          >
            Ver ficha del vehículo
          </Link>

          <Link
            href="/work-orders"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated sm:w-auto"
          >
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

          {workOrder.status !== "DELIVERED" ? (
            <section
              aria-labelledby="work-order-status-heading"
              className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3"
            >
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
                Cambiá el estado de la orden cuando el trabajo avance dentro del
                taller.
              </p>

              <UpdateWorkOrderStatusForm
                workOrderId={workOrder.id}
                currentStatus={workOrder.status}
              />
            </section>
          ) : null}
        </div>

        <aside className="min-w-0 space-y-6 xl:h-fit xl:self-start">
          <DetailSheet
            headingId="work-order-vehicle-heading"
            title="Vehículo"
            action={
              <Link
                href={`/vehicles/${vehicle.id}`}
                className="text-xs font-bold uppercase tracking-[0.14em] text-primary transition hover:text-primary-hover"
              >
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
                className="text-xs font-bold uppercase tracking-[0.14em] text-primary transition hover:text-primary-hover"
              >
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
        className={`${classes.dot} size-2 rounded-full shadow-[0_0_14px_currentColor]`}
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
  };

  return statusClassMap[status];
}
