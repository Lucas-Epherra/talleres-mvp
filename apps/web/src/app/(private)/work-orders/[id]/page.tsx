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
      <header className="rounded-[1.35rem] border border-border bg-surface/85 p-6 shadow-[var(--shadow-industrial)] ring-1 ring-white/[0.03] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
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

            <h1 className="mt-3 wrap-anywhere font-display text-2xl font-black uppercase tracking-[0.04em] text-white sm:text-3xl">
              {workOrder.reportedIssue}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Detalle operativo de la orden, vehículo asociado, cliente,
              costos, kilometraje y estado actual.
            </p>
          </div>

          <div className="shrink-0">
            <span
              className={`inline-flex w-fit rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${getStatusBadgeClass(
                workOrder.status,
              )}`}
            >
              {formatWorkOrderStatus(workOrder.status)}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={`/work-orders/${workOrder.id}/edit`}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-[0_14px_35px_rgba(214,40,40,0.22)] transition hover:bg-primary-hover sm:w-auto"
          >
            Editar orden
          </Link>

          <Link
            href={`/vehicles/${vehicle.id}`}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated sm:w-auto"
          >
            Ver ficha del vehículo
          </Link>

          <Link
            href="/work-orders"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated sm:w-auto"
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
              className="rounded-[1.35rem] border border-border bg-surface/85 p-6 shadow-[var(--shadow-industrial)] ring-1 ring-white/[0.03]"
            >
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                Flujo operativo
              </p>

              <h2
                id="work-order-status-heading"
                className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-white"
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

/**
 * Maps work order statuses to the industrial product badge system.
 */
function getStatusBadgeClass(status: WorkOrder["status"]): string {
  const statusClassMap: Record<WorkOrder["status"], string> = {
    PENDING: "border-border-strong bg-surface-muted text-muted-foreground",
    IN_PROGRESS: "border-primary/45 bg-primary/10 text-white",
    READY: "border-warning/45 bg-warning/10 text-warning",
    DELIVERED: "border-success/35 bg-success/10 text-success",
  };

  return statusClassMap[status];
}