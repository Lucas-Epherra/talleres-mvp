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
      <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              href="/work-orders"
              className="text-sm font-medium text-orange-300 transition hover:text-orange-200"
            >
              ← Volver a órdenes
            </Link>

            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">
              Orden #{workOrder.orderNumber}
            </p>

            <h1 className="mt-3 wrap-break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {workOrder.reportedIssue}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Detalle operativo de la orden, vehículo asociado, cliente,
              costos, kilometraje y estado actual.
            </p>
          </div>

          <div className="shrink-0">
            <span className="inline-flex w-fit rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100">
              {formatWorkOrderStatus(workOrder.status)}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={`/work-orders/${workOrder.id}/edit`}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-400 sm:w-auto"
          >
            Editar orden
          </Link>

          <Link
            href={`/vehicles/${vehicle.id}`}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900 sm:w-auto"
          >
            Ver ficha del vehículo
          </Link>

          <Link
            href="/work-orders"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900 sm:w-auto"
          >
            Ver todas las órdenes
          </Link>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section
            aria-labelledby="work-order-description-heading"
            className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
          >
            <h2
              id="work-order-description-heading"
              className="text-lg font-semibold text-white"
            >
              Información del trabajo
            </h2>

            <div className="mt-5 grid gap-4">
              <TextDetail
                label="Problema reportado"
                value={workOrder.reportedIssue}
              />
              <TextDetail
                label="Diagnóstico"
                value={getReadableText(
                  workOrder.diagnosis,
                  "Diagnóstico pendiente",
                )}
              />
              <TextDetail
                label="Trabajo realizado"
                value={getReadableText(workOrder.workDone, "Trabajo pendiente")}
              />
              <TextDetail
                label="Repuestos usados"
                value={getReadableText(
                  workOrder.partsUsed,
                  "Sin repuestos cargados",
                )}
              />
              <TextDetail
                label="Notas"
                value={getReadableText(workOrder.notes, "Sin notas internas")}
              />
            </div>
          </section>

          <section
            aria-labelledby="work-order-costs-heading"
            className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
          >
            <h2
              id="work-order-costs-heading"
              className="text-lg font-semibold text-white"
            >
              Fechas, kilometraje y costos
            </h2>

            <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Metric label="Ingreso" value={formatDate(workOrder.entryDate)} />
              <Metric
                label="Entrega"
                value={formatDate(workOrder.deliveryDate)}
              />
              <Metric
                label="Km ingreso"
                value={formatMileage(workOrder.entryMileage)}
              />
              <Metric
                label="Mano de obra"
                value={formatMoney(workOrder.laborCost)}
              />
              <Metric
                label="Repuestos"
                value={formatMoney(workOrder.partsCost)}
              />
              <Metric
                label="Total estimado"
                value={formatMoney(workOrder.estimatedTotal)}
              />
              <Metric
                label="Total final"
                value={formatMoney(workOrder.finalTotal)}
              />
            </dl>
          </section>

          {workOrder.status !== "DELIVERED" ? (
            <section
              aria-labelledby="work-order-status-heading"
              className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
            >
              <h2
                id="work-order-status-heading"
                className="text-lg font-semibold text-white"
              >
                Actualizar estado
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
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

        <aside className="space-y-6">
          <DetailSheet
            headingId="work-order-vehicle-heading"
            title="Vehículo"
            action={
              <Link
                href={`/vehicles/${vehicle.id}`}
                className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300 transition hover:text-orange-200"
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
            <DetailSheetRow label="Kilometraje" value={formatMileage(vehicle.mileage)} />
          </DetailSheet>

          <DetailSheet
            headingId="work-order-customer-heading"
            title="Cliente"
            action={
              <Link
                href={`/customers/${customer.id}`}
                className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300 transition hover:text-orange-200"
              >
                Ver cliente
              </Link>
            }
          >
            <DetailSheetRow label="Nombre" value={customer.fullName} />
            <DetailSheetRow label="Teléfono" value={customer.phone ?? "Sin teléfono"} />
            <DetailSheetRow label="Email" value={customer.email ?? "Sin email"} />
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

type TextDetailProps = {
  label: string;
  value: string;
};

/**
 * Large text block used for work order operational descriptions.
 */
function TextDetail({ label, value }: TextDetailProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 wrap-break-words text-sm leading-6 text-slate-300">
        {value}
      </p>
    </div>
  );
}

type MetricProps = {
  label: string;
  value: string;
};

/**
 * Compact metric item for dates, mileage and money values.
 */
function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 wrap-break-words text-sm font-semibold text-slate-100">
        {value}
      </dd>
    </div>
  );
}
