import Link from "next/link";
import {
  formatDate,
  formatMileage,
  formatMoney,
  formatWorkOrderStatus,
} from "../../../lib/format";
import {
  DetailSheet,
  DetailSheetRow,
} from "../../../components/ui/DetailSheet";
import { UpdateWorkOrderStatusForm } from "../../work-orders/components/UpdateWorkOrderStatusForm";
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
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70">
      <div className="flex flex-col gap-3 border-b border-slate-800 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>

        <p className="text-sm text-slate-400">
          {workOrders.length} orden{workOrders.length === 1 ? "" : "es"}
        </p>
      </div>

      {workOrders.length > 0 ? (
        <div className="divide-y divide-slate-800">
          {workOrders.map((workOrder) => {
            const isDelivered = workOrder.status === "DELIVERED";

            return (
              <article key={workOrder.id} className="p-6">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
                  <div className="min-w-0 space-y-5">
                    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-orange-300">
                          Orden #{workOrder.orderNumber}
                        </p>

                        <h3 className="mt-2 wrap-break-word text-xl font-semibold tracking-tight text-white">
                          {workOrder.reportedIssue}
                        </h3>
                      </div>

                      <span className="inline-flex w-fit shrink-0 rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100">
                        {formatWorkOrderStatus(workOrder.status)}
                      </span>
                    </header>

                    <DetailSheet
                      headingId={`vehicle-work-order-work-${workOrder.id}`}
                      title="Información del trabajo"
                      titleSize="sm"
                    >
                      <DetailSheetRow
                        label="Diagnóstico"
                        value={getReadableText(workOrder.diagnosis, "Diagnóstico pendiente")}
                      />
                      <DetailSheetRow
                        label="Trabajo realizado"
                        value={getReadableText(workOrder.workDone, "Trabajo pendiente")}
                      />
                      <DetailSheetRow
                        label="Repuestos usados"
                        value={getReadableText(workOrder.partsUsed, "Sin repuestos cargados")}
                      />
                      <DetailSheetRow
                        label="Notas"
                        value={getReadableText(workOrder.notes, "Sin notas internas")}
                      />
                    </DetailSheet>

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <Link
                        href={`/work-orders/${workOrder.id}`}
                        className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-400 sm:w-auto"
                      >
                        Ver orden
                      </Link>

                      {!isDelivered ? (
                        <Link
                          href={`/work-orders/${workOrder.id}/edit`}
                          className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-100 transition hover:border-orange-400 hover:text-orange-300 sm:w-auto"
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
                      label="Estimado"
                      value={formatMoney(workOrder.estimatedTotal)}
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
          <p className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
            {emptyMessage}
          </p>
        </div>
      )}
    </section>
  );
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