import { Eye, ListChecks } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "../../../components/ui/EmptyState";
import { formatDate, formatMileage, formatMoney } from "../utils";
import type { DashboardWorkOrder } from "../types";
import { DashboardWorkOrderPreviewCard } from "./DashboardWorkOrderPreviewCard";
import { WorkOrderStatusIndicator } from "./WorkOrderStatusIndicator";

type LatestWorkOrdersPanelProps = {
  workOrders: DashboardWorkOrder[];
};

/**
 * Shows the latest work orders registered in the workshop.
 *
 * Uses a spreadsheet-like table on desktop and compact cards on smaller
 * screens. The desktop table is full-width to avoid horizontal scrolling.
 */
export function LatestWorkOrdersPanel({
  workOrders,
}: LatestWorkOrdersPanelProps) {
  return (
    <section
      aria-labelledby="latest-work-orders-heading"
      className="overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated shadow-(--shadow-industrial) ring-1 ring-white/3"
    >
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-[0.66rem] font-bold uppercase tracking-[0.22em] text-primary">
            Actividad reciente
          </p>

          <h2
            id="latest-work-orders-heading"
            className="mt-1.5 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground"
          >
            Últimas órdenes
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Movimientos recientes del taller.
          </p>
        </div>

        <Link
          href="/work-orders"
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-3 text-xs font-bold text-foreground transition hover:border-primary/60 hover:bg-surface sm:w-auto"
        >
          <ListChecks className="size-3.5 shrink-0" aria-hidden="true" />
          Ver órdenes
        </Link>
      </div>

      {workOrders.length > 0 ? (
        <>
          <div className="grid gap-3 p-4 xl:hidden">
            {workOrders.map((workOrder) => (
              <DashboardWorkOrderPreviewCard
                key={workOrder.id}
                workOrder={workOrder}
              />
            ))}
          </div>

          <div className="hidden xl:block">
            <table className="w-full table-fixed text-left">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[19%]" />
                <col className="w-[18%]" />
                <col className="w-[13%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[8%]" />
              </colgroup>

              <thead className="border-b border-border bg-surface-muted/85 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Orden
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Vehículo
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Cliente
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Ingreso
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Estimado
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {workOrders.map((workOrder, index) => (
                  <tr
                    key={workOrder.id}
                    className={
                      index % 2 === 0
                        ? "align-top transition hover:bg-surface-muted/55"
                        : "bg-surface-muted/25 align-top transition hover:bg-surface-muted/55"
                    }
                  >
                    <td className="px-4 py-4">
                      <p className="font-display text-xs font-black uppercase tracking-[0.04em] text-foreground">
                        #{workOrder.orderNumber}
                      </p>

                      <p className="mt-1 line-clamp-2 wrap-anywhere text-xs leading-5 text-muted-foreground">
                        {workOrder.reportedIssue}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-display text-xs font-black uppercase tracking-[0.04em] text-foreground">
                        {workOrder.vehicle.licensePlate}
                      </p>

                      <p className="mt-1 line-clamp-1 wrap-anywhere text-xs text-muted-foreground">
                        {workOrder.vehicle.brand} {workOrder.vehicle.model}
                      </p>

                      <p className="mt-1 text-[0.68rem] text-steel">
                        {formatMileage(workOrder.vehicle.mileage)}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="line-clamp-1 wrap-anywhere text-xs font-bold text-foreground">
                        {workOrder.vehicle.customer.fullName}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {workOrder.vehicle.customer.phone ?? "Sin teléfono"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <WorkOrderStatusIndicator
                        status={workOrder.status}
                        withLabel={false}
                      />
                    </td>

                    <td className="px-4 py-4 text-xs font-bold text-muted-foreground">
                      {formatDate(workOrder.entryDate)}
                    </td>

                    <td className="px-4 py-4 text-xs font-black text-foreground">
                      {formatMoney(workOrder.estimatedTotal)}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/work-orders/${workOrder.id}`}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-border-strong bg-surface-muted px-3 text-[0.68rem] font-bold text-foreground transition hover:border-primary/60 hover:bg-surface"
                      >
                        <Eye className="size-3.5 shrink-0" aria-hidden="true" />
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="p-4 sm:p-5">
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
