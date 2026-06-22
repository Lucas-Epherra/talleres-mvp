import { ClipboardPlus } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Pagination } from "../../../components/ui/Pagination";
import {
  normalizeSearchParam,
  type WorkOrderStatus,
} from "../../../lib/format";
import { WorkOrderCard } from "../../../features/work-orders/components/WorkOrderCard";
import { WorkOrdersFilters } from "../../../features/work-orders/components/WorkOrdersFilters";
import { getPaginatedWorkOrders } from "../../../features/work-orders/work-orders.server";

export const metadata: Metadata = {
  title: "Órdenes de trabajo",
};

const WORK_ORDERS_PAGE_LIMIT = 10;

type WorkOrdersPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    status?: string | string[];
    page?: string | string[];
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
 * This route fetches paginated data server-side and forwards the httpOnly
 * cookie through apiServerFetch, keeping auth tokens out of the browser runtime.
 */
export default async function WorkOrdersPage({
  searchParams,
}: WorkOrdersPageProps) {
  const resolvedSearchParams = await searchParams;
  const search = normalizeSearchParam(resolvedSearchParams.search);
  const status = getValidWorkOrderStatus(
    normalizeSearchParam(resolvedSearchParams.status),
  );
  const page = normalizePageParam(resolvedSearchParams.page);

  const workOrdersPage = await getPaginatedWorkOrders({
    search: search || undefined,
    status,
    page,
    limit: WORK_ORDERS_PAGE_LIMIT,
  });

  const workOrders = workOrdersPage.data;
  const meta = workOrdersPage.meta;
  const pageActiveCount = workOrders.filter(
    (workOrder) => workOrder.status !== "DELIVERED",
  ).length;
  const pageDeliveredCount = workOrders.filter(
    (workOrder) => workOrder.status === "DELIVERED",
  ).length;
  const hasFilters = Boolean(search || status);
  const hasWorkOrders = workOrders.length > 0;

  return (
    <section className="space-y-6 sm:space-y-8">
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              Órdenes
            </p>

            <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
              Órdenes de trabajo
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Vista operativa para consultar órdenes por estado, cliente,
              patente, vehículo o diagnóstico.
            </p>
          </div>

          <Link
            href="/vehicles"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover sm:w-auto"
          >
            <ClipboardPlus className="size-4 shrink-0" aria-hidden="true" />
            Crear desde vehículo
          </Link>
        </div>

        <dl className="relative mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3">
          <SummaryItem label="Resultados" value={meta.totalItems} />
          <SummaryItem label="Activas en página" value={pageActiveCount} />
          <SummaryItem
            label="Entregadas en página"
            value={pageDeliveredCount}
          />
        </dl>
      </header>

      <WorkOrdersFilters currentSearch={search} currentStatus={status} />

      {hasWorkOrders ? (
        <>
          <section
            aria-labelledby="work-orders-results-heading"
            className="space-y-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2
                  id="work-orders-results-heading"
                  className="font-display text-lg font-black uppercase tracking-[0.04em] text-foreground"
                >
                  {hasFilters ? "Resultados" : "Registradas"}
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Página <span className="font-black">{meta.page}</span> de{" "}
                  <span className="font-black">{meta.totalPages}</span>
                </p>
              </div>

              <p className="text-sm font-semibold text-muted-foreground">
                Mostrando {workOrders.length} de {meta.totalItems}
              </p>
            </div>

            <div className="grid gap-4">
              {workOrders.map((workOrder, index) => (
                <WorkOrderCard
                  key={workOrder.id}
                  workOrder={workOrder}
                  variant={index % 2 === 0 ? "accent" : "neutral"}
                />
              ))}
            </div>
          </section>

          <Pagination
            basePath="/work-orders"
            currentPage={meta.page}
            totalPages={meta.totalPages}
            searchParams={{
              search: search || undefined,
              status,
            }}
            ariaLabel="Paginación de órdenes de trabajo"
          />
        </>
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

/**
 * Summary metric for the filtered work orders result set.
 */
function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <dt className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
        {label}
      </dt>

      <dd className="mt-2 font-display text-2xl font-black text-foreground">
        {value}
      </dd>
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

/**
 * Normalizes a page search param into a safe positive integer.
 */
function normalizePageParam(value: string | string[] | undefined): number {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = rawValue ? Number(rawValue) : 1;

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return 1;
  }

  return parsedValue;
}
