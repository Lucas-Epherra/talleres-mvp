import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState } from "../../../components/ui/EmptyState";
import {
  normalizeSearchParam,
  type WorkOrderStatus,
} from "../../../lib/format";
import { WorkOrderCard } from "../../../features/work-orders/components/WorkOrderCard";
import { WorkOrdersFilters } from "../../../features/work-orders/components/WorkOrdersFilters";
import { getWorkOrders } from "../../../features/work-orders/work-orders.server";

export const metadata: Metadata = {
  title: "Órdenes de trabajo",
};

type WorkOrdersPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    status?: string | string[];
  }>;
};

const WORK_ORDER_STATUSES: WorkOrderStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "READY",
  "DELIVERED",
];

/**
 * Work orders list page.
 *
 * This route fetches data server-side and forwards the httpOnly cookie through
 * apiServerFetch, keeping auth tokens out of the browser runtime.
 */
export default async function WorkOrdersPage({
  searchParams,
}: WorkOrdersPageProps) {
  const resolvedSearchParams = await searchParams;
  const search = normalizeSearchParam(resolvedSearchParams.search);
  const status = getValidWorkOrderStatus(
    normalizeSearchParam(resolvedSearchParams.status),
  );

  const workOrders = await getWorkOrders({
    search,
    status,
  });

  const activeCount = workOrders.filter(
    (workOrder) => workOrder.status !== "DELIVERED",
  ).length;
  const deliveredCount = workOrders.filter(
    (workOrder) => workOrder.status === "DELIVERED",
  ).length;
  const hasFilters = Boolean(search || status);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">
              Órdenes
            </p>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Órdenes de trabajo
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Vista operativa para consultar órdenes por estado, cliente,
              patente, vehículo o diagnóstico.
            </p>
          </div>

          <Link
            href="/vehicles"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-400 sm:w-auto"
          >
            Crear desde vehículo
          </Link>
        </div>

        <dl className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3">
          <SummaryItem label="Resultados" value={workOrders.length} />
          <SummaryItem label="Activas" value={activeCount} />
          <SummaryItem label="Entregadas" value={deliveredCount} />
        </dl>
      </div>

      <WorkOrdersFilters currentSearch={search} currentStatus={status} />

      {workOrders.length > 0 ? (
        <div className="space-y-4">
          {workOrders.map((workOrder) => (
            <WorkOrderCard key={workOrder.id} workOrder={workOrder} />
          ))}
        </div>
      ) : (
        <EmptyState
          eyebrow={hasFilters ? "Sin resultados" : "Primera orden"}
          title={
            hasFilters
              ? "No se encontraron órdenes"
              : "Todavía no hay órdenes de trabajo"
          }
          description={
            hasFilters
              ? "Probá limpiar los filtros o buscar por otra patente, cliente, vehículo o diagnóstico."
              : "Para mantener el flujo principal del MVP, creá la primera orden desde la ficha de un vehículo."
          }
          actions={
            hasFilters
              ? [
                  {
                    label: "Limpiar filtros",
                    href: "/work-orders",
                    variant: "primary",
                  },
                  {
                    label: "Crear desde vehículo",
                    href: "/vehicles",
                    variant: "secondary",
                  },
                ]
              : [
                  {
                    label: "Ir a vehículos",
                    href: "/vehicles",
                    variant: "primary",
                  },
                  {
                    label: "Crear cliente",
                    href: "/customers/new",
                    variant: "secondary",
                  },
                ]
          }
        />
      )}
    </section>
  );
}

type SummaryItemProps = {
  label: string;
  value: number;
};

/**
 * Summary metric for the filtered work orders result set.
 */
function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 text-2xl font-semibold text-white">{value}</dd>
    </div>
  );
}

/**
 * Returns a valid work order status from a query param value.
 */
function getValidWorkOrderStatus(value: string): WorkOrderStatus | undefined {
  if (WORK_ORDER_STATUSES.includes(value as WorkOrderStatus)) {
    return value as WorkOrderStatus;
  }

  return undefined;
}