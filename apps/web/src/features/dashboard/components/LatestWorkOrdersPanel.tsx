import { Eye, ListChecks, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "../../../components/ui/EmptyState";
import { formatDate, formatMileage, formatMoney } from "../utils";
import type { DashboardWorkOrder } from "../types";
import { WorkOrderStatusIndicator } from "./WorkOrderStatusIndicator";

type LatestWorkOrdersPanelProps = {
  workOrders: DashboardWorkOrder[];
};

/**
 * Shows recent work orders using a clean spreadsheet-like layout.
 */
export function LatestWorkOrdersPanel({ workOrders }: LatestWorkOrdersPanelProps) {
  return (
    <section
      aria-labelledby="latest-work-orders-heading"
      className="overflow-hidden rounded-[1.35rem] border border-border bg-white/96 shadow-(--shadow-industrial) ring-1 ring-white/70"
    >
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="text-[0.66rem] font-black uppercase tracking-[0.2em] text-primary">
            Órdenes recientes
          </p>

          <h2
            id="latest-work-orders-heading"
            className="mt-1.5 font-display text-lg font-black uppercase tracking-[0.035em] text-foreground"
          >
            Últimas órdenes cargadas
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Revisá los últimos trabajos registrados en el taller.
          </p>
        </div>

        <Link
          href="/work-orders"
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl px-3 text-xs font-black uppercase tracking-[0.12em] text-primary transition hover:bg-primary/8 sm:w-auto"
        >
          <ListChecks className="size-3.5 shrink-0" aria-hidden="true" />
          Ver todas
        </Link>
      </div>

      {workOrders.length > 0 ? (
        <>
          <div className="grid gap-3 p-4 xl:hidden">
            {workOrders.map((workOrder) => (
              <MobileWorkOrderCard key={workOrder.id} workOrder={workOrder} />
            ))}
          </div>

          <div className="hidden xl:block">
            <table className="w-full table-fixed text-left">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[20%]" />
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[6%]" />
              </colgroup>

              <thead className="border-b border-border bg-surface-muted/70 text-[0.62rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">Orden</th>
                  <th scope="col" className="px-4 py-3">Vehículo</th>
                  <th scope="col" className="px-4 py-3">Cliente</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                  <th scope="col" className="px-4 py-3">Ingreso</th>
                  <th scope="col" className="px-4 py-3">Total</th>
                  <th scope="col" className="px-4 py-3 text-right">Ver</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {workOrders.map((workOrder) => (
                  <tr
                    key={workOrder.id}
                    className="align-top transition hover:bg-surface-muted/45"
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
                      <WorkOrderStatusIndicator status={workOrder.status} withLabel={false} />
                    </td>

                    <td className="px-4 py-4 text-xs font-bold text-muted-foreground">
                      {formatDate(workOrder.entryDate)}
                    </td>

                    <td className="px-4 py-4 text-xs font-black text-foreground">
                      {formatMoney(workOrder.finalTotal ?? workOrder.estimatedTotal)}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/work-orders/${workOrder.id}`}
                        className="inline-flex size-8 items-center justify-center rounded-xl border border-border-strong bg-surface-muted text-foreground transition hover:border-primary/40 hover:bg-white hover:text-primary"
                        aria-label={`Ver orden ${workOrder.orderNumber}`}
                      >
                        <MoreHorizontal className="size-4" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="p-5">
          <EmptyState
            eyebrow="Sin movimientos"
            title="Todavía no hay órdenes recientes"
            description="Cuando cargues órdenes, los últimos trabajos van a aparecer acá."
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

function MobileWorkOrderCard({ workOrder }: { workOrder: DashboardWorkOrder }) {
  return (
    <article className="rounded-2xl border border-border bg-surface-muted/55 p-3.5 transition hover:border-primary/30 hover:bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-primary">Orden #{workOrder.orderNumber}</p>
          <h3 className="mt-1 line-clamp-2 wrap-anywhere font-display text-sm font-black uppercase leading-5 tracking-[0.035em] text-foreground">
            {workOrder.reportedIssue}
          </h3>
        </div>

        <WorkOrderStatusIndicator status={workOrder.status} withLabel={false} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <SmallDetail
          label="Vehículo"
          value={`${workOrder.vehicle.licensePlate} · ${workOrder.vehicle.brand} ${workOrder.vehicle.model}`}
        />
        <SmallDetail label="Cliente" value={workOrder.vehicle.customer.fullName} />
        <SmallDetail label="Ingreso" value={formatDate(workOrder.entryDate)} />
        <SmallDetail
          label="Total"
          value={formatMoney(workOrder.finalTotal ?? workOrder.estimatedTotal)}
        />
      </div>

      <Link
        href={`/work-orders/${workOrder.id}`}
        className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-white px-4 text-xs font-bold text-foreground transition hover:border-primary/45 hover:text-primary"
      >
        <Eye className="size-3.5" aria-hidden="true" />
        Ver orden
      </Link>
    </article>
  );
}

function SmallDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-white/75 p-2">
      <p className="text-[0.58rem] font-black uppercase tracking-[0.16em] text-primary sm:text-[0.62rem] sm:tracking-[0.18em]">
        {label}
      </p>
      <p className="mt-1 line-clamp-1 wrap-anywhere text-xs font-bold text-foreground">{value}</p>
    </div>
  );
}
