import Link from "next/link";
import { EmptyState } from "../../../components/ui/EmptyState";
import {
  formatDate,
  formatMileage,
  formatMoney,
} from "../utils";
import type { DashboardWorkOrder } from "../types";
import { DashboardWorkOrderPreviewCard } from "./DashboardWorkOrderPreviewCard";
import { WorkOrderStatusIndicator } from "./WorkOrderStatusIndicator";

type LatestWorkOrdersPanelProps = {
  workOrders: DashboardWorkOrder[];
};

/**
 * Shows the latest work orders registered in the workshop.
 */
export function LatestWorkOrdersPanel({ workOrders }: LatestWorkOrdersPanelProps) {
  return (
    <section
      aria-labelledby="latest-work-orders-heading"
      className="overflow-hidden rounded-[1.35rem] border border-border bg-surface/85 shadow-(--shadow-industrial) ring-1 ring-white/3"
    >
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Actividad reciente
          </p>

          <h2
            id="latest-work-orders-heading"
            className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-white"
          >
            Últimas órdenes
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Movimientos recientes del taller.
          </p>
        </div>

        <Link
          href="/work-orders"
          className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated sm:w-auto"
        >
          Ver órdenes
        </Link>
      </div>

      {workOrders.length > 0 ? (
        <>
          <div className="grid gap-4 p-5 xl:hidden">
            {workOrders.map((workOrder) => (
              <DashboardWorkOrderPreviewCard
                key={workOrder.id}
                workOrder={workOrder}
              />
            ))}
          </div>

          <div className="hidden xl:block">
            <table className="w-full text-left">
              <thead className="border-b border-border bg-background/35 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                <tr>
                  <th scope="col" className="px-6 py-4">
                    Orden
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Vehículo
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Ingreso
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Estimado
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {workOrders.map((workOrder) => (
                  <tr
                    key={workOrder.id}
                    className="align-top transition hover:bg-background/30"
                  >
                    <td className="px-6 py-5">
                      <p className="font-display text-sm font-black uppercase tracking-[0.04em] text-white">
                        #{workOrder.orderNumber}
                      </p>

                      <p className="mt-1 max-w-xs wrap-anywhere text-sm leading-6 text-muted-foreground">
                        {workOrder.reportedIssue}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-display text-sm font-black uppercase tracking-[0.04em] text-white">
                        {workOrder.vehicle.licensePlate}
                      </p>

                      <p className="mt-1 wrap-anywhere text-sm text-muted-foreground">
                        {workOrder.vehicle.brand} {workOrder.vehicle.model}
                      </p>

                      <p className="mt-1 text-xs text-steel">
                        {formatMileage(workOrder.vehicle.mileage)}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="wrap-anywhere text-sm font-bold text-white">
                        {workOrder.vehicle.customer.fullName}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {workOrder.vehicle.customer.phone ?? "Sin teléfono"}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <WorkOrderStatusIndicator
                        status={workOrder.status}
                        withLabel={false}
                      />
                    </td>

                    <td className="px-6 py-5 text-sm text-muted-foreground">
                      {formatDate(workOrder.entryDate)}
                    </td>

                    <td className="px-6 py-5 text-sm font-bold text-white">
                      {formatMoney(workOrder.estimatedTotal)}
                    </td>

                    <td className="px-6 py-5">
                      <Link
                        href={`/work-orders/${workOrder.id}`}
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-3 text-xs font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated"
                      >
                        Ver orden
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="p-5 sm:p-6">
          <EmptyState
            eyebrow="Sin movimientos"
            title="Todavía no hay órdenes recientes"
            description="Cuando el taller empiece a registrar órdenes, los últimos movimientos van a aparecer acá. El flujo recomendado es crear la orden desde la ficha del vehículo."
            actions={[
              {
                label: "Ir a vehículos",
                href: "/vehicles",
                variant: "primary",
              },
              {
                label: "Ver órdenes",
                href: "/work-orders",
                variant: "secondary",
              },
            ]}
          />
        </div>
      )}
    </section>
  );
}