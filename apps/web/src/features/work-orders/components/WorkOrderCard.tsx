import Link from "next/link";
import {
  formatDate,
  formatMileage,
  formatMoney,
  formatWorkOrderStatus,
} from "../../../lib/format";
import type { WorkOrder } from "../types";

type WorkOrderCardProps = {
  workOrder: WorkOrder;
};

/**
 * Displays a work order summary in the global work orders list.
 *
 * The card groups operational data, vehicle/customer context and financial
 * values into clear sections so the order can be scanned quickly before opening
 * the full detail page.
 */
export function WorkOrderCard({ workOrder }: WorkOrderCardProps) {
  const { vehicle, status } = workOrder;
  const customer = vehicle.customer;

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <header className="border-b border-slate-800 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-orange-300">
                  Orden #{workOrder.orderNumber}
                </p>

                <h2 className="mt-2 wrap-break-word text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  {workOrder.reportedIssue}
                </h2>
              </div>

              <span className="inline-flex w-fit shrink-0 rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100">
                {formatWorkOrderStatus(status)}
              </span>
            </div>
          </header>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <OrderMetaItem
              label="Ingreso"
              value={formatDate(workOrder.entryDate)}
            />
            <OrderMetaItem
              label="Entrega"
              value={formatDate(workOrder.deliveryDate)}
            />
            <OrderMetaItem
              label="Km ingreso"
              value={formatMileage(workOrder.entryMileage)}
            />
            <OrderMetaItem
              label="Total final"
              value={formatMoney(workOrder.finalTotal)}
            />
          </div>

          <section
            aria-labelledby={`work-order-operation-${workOrder.id}`}
            className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-4"
          >
            <h3
              id={`work-order-operation-${workOrder.id}`}
              className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
            >
              Información del trabajo
            </h3>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <WorkTextItem
                label="Diagnóstico"
                value={workOrder.diagnosis ?? "Diagnóstico pendiente"}
              />
              <WorkTextItem
                label="Trabajo realizado"
                value={workOrder.workDone ?? "Trabajo pendiente"}
              />
              <WorkTextItem
                label="Repuestos"
                value={workOrder.partsUsed ?? "Sin repuestos cargados"}
              />
            </div>
          </section>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <section
              aria-labelledby={`work-order-vehicle-${workOrder.id}`}
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
            >
              <h3
                id={`work-order-vehicle-${workOrder.id}`}
                className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
              >
                Vehículo
              </h3>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <ContextMetaItem label="Patente" value={vehicle.licensePlate} />
                <ContextMetaItem
                  label="Modelo"
                  value={`${vehicle.brand} ${vehicle.model}${
                    vehicle.year ? ` · ${vehicle.year}` : ""
                  }`}
                />
                <ContextMetaItem
                  label="Último km"
                  value={formatMileage(vehicle.mileage)}
                />
              </div>
            </section>

            <section
              aria-labelledby={`work-order-customer-${workOrder.id}`}
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
            >
              <h3
                id={`work-order-customer-${workOrder.id}`}
                className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
              >
                Cliente
              </h3>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <ContextMetaItem label="Nombre" value={customer.fullName} />
                <ContextMetaItem
                  label="Teléfono"
                  value={customer.phone ?? "Sin teléfono"}
                />
                <ContextMetaItem
                  label="Email"
                  value={customer.email ?? "Sin email"}
                />
              </div>
            </section>
          </div>

          <section
            aria-labelledby={`work-order-costs-${workOrder.id}`}
            className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-4"
          >
            <h3
              id={`work-order-costs-${workOrder.id}`}
              className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
            >
              Costos
            </h3>

            <dl className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <CostItem
                label="Mano de obra"
                value={formatMoney(workOrder.laborCost)}
              />
              <CostItem
                label="Repuestos"
                value={formatMoney(workOrder.partsCost)}
              />
              <CostItem
                label="Estimado"
                value={formatMoney(workOrder.estimatedTotal)}
              />
              <CostItem
                label="Total final"
                value={formatMoney(workOrder.finalTotal)}
              />
            </dl>
          </section>

          {workOrder.notes ? (
            <section
              aria-labelledby={`work-order-notes-${workOrder.id}`}
              className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-4"
            >
              <h3
                id={`work-order-notes-${workOrder.id}`}
                className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
              >
                Notas internas
              </h3>

              <p className="mt-3 wrap-break-word text-sm leading-6 text-slate-300">
                {workOrder.notes}
              </p>
            </section>
          ) : null}
        </div>

        <aside className="w-full shrink-0 lg:w-48">
          <div className="flex flex-col gap-3 lg:border-l lg:border-slate-800 lg:pl-5">
            <Link
              href={`/work-orders/${workOrder.id}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-400"
            >
              Ver orden
            </Link>

            <Link
              href={`/work-orders/${workOrder.id}/edit`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-100 transition hover:border-orange-400 hover:text-orange-300"
            >
              Editar orden
            </Link>

            <Link
              href={`/vehicles/${vehicle.id}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-100 transition hover:border-orange-400 hover:text-orange-300"
            >
              Ver ficha
            </Link>
          </div>
        </aside>
      </div>
    </article>
  );
}

type OrderMetaItemProps = {
  label: string;
  value: string;
};

/**
 * Compact metadata block for relevant work order dates and totals.
 */
function OrderMetaItem({ label, value }: OrderMetaItemProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 wrap-break-word text-sm font-medium text-slate-100">
        {value}
      </p>
    </div>
  );
}

type WorkTextItemProps = {
  label: string;
  value: string;
};

/**
 * Compact text block for operational work order content.
 */
function WorkTextItem({ label, value }: WorkTextItemProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 wrap-break-word text-sm leading-6 text-slate-300">
        {value}
      </p>
    </div>
  );
}

type ContextMetaItemProps = {
  label: string;
  value: string;
};

/**
 * Compact metadata block for vehicle and customer context.
 */
function ContextMetaItem({ label, value }: ContextMetaItemProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 wrap-break-word text-sm font-medium text-slate-100">
        {value}
      </p>
    </div>
  );
}

type CostItemProps = {
  label: string;
  value: string;
};

/**
 * Compact definition item for financial work order values.
 */
function CostItem({ label, value }: CostItemProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
      <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 wrap-break-word text-sm font-semibold text-slate-100">
        {value}
      </dd>
    </div>
  );
}