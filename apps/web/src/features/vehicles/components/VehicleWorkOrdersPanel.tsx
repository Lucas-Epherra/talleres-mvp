import Link from "next/link";
import {
  formatDate,
  formatMileage,
  formatMoney,
  formatWorkOrderStatus,
} from "../../../lib/format";
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
 * Historical delivered orders keep a read-only detail shortcut.
 */
export function VehicleWorkOrdersPanel({
  title,
  description,
  emptyMessage,
  workOrders,
}: VehicleWorkOrdersPanelProps) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70">
      <div className="border-b border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>

      {workOrders.length > 0 ? (
        <div className="divide-y divide-slate-800">
          {workOrders.map((workOrder) => {
            const isDelivered = workOrder.status === "DELIVERED";

            return (
              <article key={workOrder.id} className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-orange-300">
                        Orden #{workOrder.orderNumber}
                      </p>

                      <h3 className="mt-2 text-lg font-semibold text-white">
                        {workOrder.reportedIssue}
                      </h3>
                    </div>

                    <div className="grid gap-3 text-sm text-slate-400 md:grid-cols-2">
                      <p>
                        <span className="text-slate-500">Diagnóstico:</span>{" "}
                        {workOrder.diagnosis ?? "Pendiente"}
                      </p>

                      <p>
                        <span className="text-slate-500">
                          Trabajo realizado:
                        </span>{" "}
                        {workOrder.workDone ?? "Pendiente"}
                      </p>

                      <p>
                        <span className="text-slate-500">Repuestos:</span>{" "}
                        {workOrder.partsUsed ?? "Sin cargar"}
                      </p>

                      <p>
                        <span className="text-slate-500">
                          Kilometraje ingreso:
                        </span>{" "}
                        {formatMileage(workOrder.entryMileage)}
                      </p>
                    </div>

                    {workOrder.notes ? (
                      <p className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm leading-6 text-slate-400">
                        {workOrder.notes}
                      </p>
                    ) : null}

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

                  <dl className="grid shrink-0 gap-3 sm:grid-cols-2 lg:w-90">
                    <Detail
                      label="Estado"
                      value={formatWorkOrderStatus(workOrder.status)}
                    />
                    <Detail
                      label="Ingreso"
                      value={formatDate(workOrder.entryDate)}
                    />
                    <Detail
                      label="Entrega"
                      value={formatDate(workOrder.deliveryDate)}
                    />
                    <Detail
                      label="Estimado"
                      value={formatMoney(workOrder.estimatedTotal)}
                    />
                    <Detail
                      label="Mano de obra"
                      value={formatMoney(workOrder.laborCost)}
                    />
                    <Detail
                      label="Total final"
                      value={formatMoney(workOrder.finalTotal)}
                    />
                  </dl>
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

type DetailProps = {
  label: string;
  value: string;
};

/**
 * Compact definition item for work order metadata.
 */
function Detail({ label, value }: DetailProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-semibold text-slate-100">{value}</dd>
    </div>
  );
}