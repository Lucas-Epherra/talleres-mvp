import { ClipboardList, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "../../../components/ui/Pagination";
import { SearchForm } from "../../../components/ui/SearchForm";
import { WorkOrderCard } from "../../../features/work-orders/components/WorkOrderCard";
import { getPaginatedWorkOrders } from "../../../features/work-orders/work-orders.service";
import type { WorkOrder } from "../../../features/work-orders/types";
import {
  formatMoney,
  formatWorkOrderStatus,
  type WorkOrderStatus,
} from "../../../lib/format";

export const metadata: Metadata = {
  title: "Órdenes",
};

const WORK_ORDERS_PAGE_LIMIT = 10;

const WORK_ORDER_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "READY",
  "DELIVERED",
  "CANCELLED",
] as const satisfies readonly WorkOrderStatus[];

type WorkOrdersPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    page?: string | string[];
    status?: string | string[];
  }>;
};

/**
 * Main work orders list page.
 *
 * This screen keeps the operational list focused: search, status filter,
 * quick metrics for the current result set and paginated work order cards.
 */
export default async function WorkOrdersPage({
  searchParams,
}: WorkOrdersPageProps) {
  const resolvedSearchParams = await searchParams;
  const search = normalizeSearchParam(resolvedSearchParams.search);
  const page = normalizePageParam(resolvedSearchParams.page);
  const status = normalizeStatusParam(resolvedSearchParams.status);

  const workOrdersPage = await getPaginatedWorkOrders({
    search: search || undefined,
    status,
    page,
    limit: WORK_ORDERS_PAGE_LIMIT,
  });

  const workOrders = workOrdersPage.data;
  const { meta } = workOrdersPage;
  const hasSearch = search.length > 0;
  const hasFilters = hasSearch || Boolean(status);

  return (
    <section className="space-y-6 sm:space-y-8">
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              <ClipboardList className="size-4 shrink-0" aria-hidden="true" />
              Órdenes
            </p>

            <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
              Órdenes del taller
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Seguimiento operativo de trabajos pendientes, en progreso,
              listos, entregados o anulados. Para crear una orden, primero
              elegí el vehículo correspondiente.
            </p>
          </div>

          <Link
            href="/vehicles"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover sm:w-auto"
          >
            <Plus className="size-4 shrink-0" aria-hidden="true" />
            Nueva orden
          </Link>
        </div>

        <SearchForm
          id="work-orders-search"
          label="Buscar"
          defaultValue={search}
          placeholder="Buscar por orden, cliente, vehículo, patente o problema..."
          clearHref={buildWorkOrdersHref({ status })}
          showClearAction={hasSearch}
        />

        <WorkOrderStatusFilters
          currentStatus={status}
          search={search || undefined}
        />
      </header>

      <WorkOrdersSummary workOrders={workOrders} totalItems={meta.totalItems} />

      <section aria-labelledby="work-orders-results-heading" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h2
              id="work-orders-results-heading"
              className="font-display text-lg font-black uppercase tracking-[0.04em] text-foreground"
            >
              {getResultsTitle(status, hasSearch)}
            </h2>

            {meta.totalItems > 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Página {meta.page} de {meta.totalPages}
              </p>
            ) : null}
          </div>

          <p className="shrink-0 text-sm font-semibold text-muted-foreground">
            {meta.totalItems} orden{meta.totalItems === 1 ? "" : "es"} en total
          </p>
        </div>

        {workOrders.length > 0 ? (
          <div className="grid gap-4">
            {workOrders.map((workOrder, index) => (
              <WorkOrderCard
                key={workOrder.id}
                workOrder={workOrder}
                variant={index % 2 === 0 ? "accent" : "neutral"}
              />
            ))}
          </div>
        ) : (
          <EmptyWorkOrdersState hasFilters={hasFilters} />
        )}

        {meta.totalPages > 1 ? (
          <Pagination
            basePath="/work-orders"
            currentPage={meta.page}
            totalPages={meta.totalPages}
            searchParams={{
              search: search || undefined,
              status,
            }}
            ariaLabel="Paginación de órdenes"
          />
        ) : null}
      </section>
    </section>
  );
}

type WorkOrdersSummaryProps = {
  workOrders: WorkOrder[];
  totalItems: number;
};

/**
 * Compact summary for the current result set.
 */
function WorkOrdersSummary({ workOrders, totalItems }: WorkOrdersSummaryProps) {
  const activeCount = workOrders.filter(isActiveWorkOrder).length;
  const readyCount = workOrders.filter(
    (workOrder) => workOrder.status === "READY",
  ).length;
  const deliveredCount = workOrders.filter(
    (workOrder) => workOrder.status === "DELIVERED",
  ).length;
  const visibleFinalTotal = workOrders.reduce((total, workOrder) => {
    return total + moneyToNumber(workOrder.finalTotal ?? workOrder.estimatedTotal);
  }, 0);

  return (
    <section
      aria-label="Resumen de órdenes"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <SummaryCard label="Total" value={`${totalItems}`} />
      <SummaryCard label="Activas" value={`${activeCount}`} />
      <SummaryCard label="Listas" value={`${readyCount}`} tone="warning" />
      <SummaryCard label="Entregadas" value={`${deliveredCount}`} />
      <SummaryCard
        label="Valor visible"
        value={formatMoney(visibleFinalTotal)}
        className="sm:col-span-2 lg:col-span-4"
      />
    </section>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  tone?: "neutral" | "warning";
  className?: string;
};

/**
 * Small metric card used above the work order list.
 */
function SummaryCard({
  label,
  value,
  tone = "neutral",
  className,
}: SummaryCardProps) {
  return (
    <div
      className={buildClassName(
        tone === "warning"
          ? "rounded-2xl border border-warning/45 bg-warning/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
          : "rounded-2xl border border-border bg-surface-muted/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
        className,
      )}
    >
      <p
        className={
          tone === "warning"
            ? "text-[0.68rem] font-bold uppercase tracking-[0.22em] text-warning"
            : "text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary"
        }
      >
        {label}
      </p>

      <p className="mt-2 font-display text-xl font-black text-foreground">
        {value}
      </p>
    </div>
  );
}

type WorkOrderStatusFiltersProps = {
  currentStatus?: WorkOrderStatus;
  search?: string;
};

/**
 * Server-rendered status filter navigation for work orders.
 */
function WorkOrderStatusFilters({
  currentStatus,
  search,
}: WorkOrderStatusFiltersProps) {
  const filters: Array<{
    label: string;
    value?: WorkOrderStatus;
  }> = [
    { label: "Todos los estados" },
    { label: "Pendientes", value: "PENDING" },
    { label: "En progreso", value: "IN_PROGRESS" },
    { label: "Listas", value: "READY" },
    { label: "Entregadas", value: "DELIVERED" },
    { label: "Anuladas", value: "CANCELLED" },
  ];

  return (
    <section aria-labelledby="work-order-status-filter-heading" className="mt-5">
      <div className="flex flex-col gap-1">
        <h2
          id="work-order-status-filter-heading"
          className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary"
        >
          Estado de orden
        </h2>

        <p className="text-xs leading-5 text-muted-foreground">
          Filtrá por avance operativo de la orden.
        </p>
      </div>

      <form action="/work-orders" className="mt-2 grid gap-2 sm:hidden">
        {search ? <input type="hidden" name="search" value={search} /> : null}

        <select
          name="status"
          defaultValue={currentStatus ?? ""}
          aria-label="Filtrar por estado de orden"
          className="h-11 w-full rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {filters.map((filter) => (
            <option key={filter.value ?? "all"} value={filter.value ?? ""}>
              {filter.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-hover"
        >
          Aplicar estado
        </button>
      </form>

      <nav
        aria-label="Filtro de estado de órdenes"
        className="mt-2 hidden flex-wrap gap-2 sm:flex"
      >
        {filters.map((filter) => {
          const isActive = currentStatus === filter.value;

          return (
            <Link
              key={filter.value ?? "all"}
              href={buildWorkOrdersHref({
                search,
                status: filter.value,
              })}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "inline-flex h-10 items-center justify-center rounded-xl border border-primary bg-primary px-4 text-sm font-bold text-white"
                  : "inline-flex h-10 items-center justify-center rounded-xl border border-border-strong bg-surface px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
              }
            >
              {filter.value ? formatWorkOrderStatus(filter.value) : filter.label}
            </Link>
          );
        })}
      </nav>
    </section>
  );
}

type EmptyWorkOrdersStateProps = {
  hasFilters: boolean;
};

/**
 * Empty state for work order lists.
 */
function EmptyWorkOrdersState({ hasFilters }: EmptyWorkOrdersStateProps) {
  return (
    <section className="rounded-[1.1rem] border border-dashed border-border-strong bg-surface p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:rounded-[1.35rem] sm:p-8">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
        Sin órdenes
      </p>

      <h2 className="mt-3 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground">
        {hasFilters
          ? "No hay órdenes para esta búsqueda"
          : "Todavía no hay órdenes cargadas"}
      </h2>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        {hasFilters
          ? "Probá limpiar la búsqueda o cambiar el estado para volver a ver el flujo completo del taller."
          : "Para crear una orden, entrá a la ficha de un vehículo y cargá el trabajo desde ahí. Así la orden queda asociada al cliente y al historial correcto."}
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {hasFilters ? (
          <Link
            href="/work-orders"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover"
          >
            Limpiar filtros
          </Link>
        ) : null}

        <Link
          href="/vehicles"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
        >
          Ver vehículos
        </Link>
      </div>
    </section>
  );
}

/**
 * Builds a work orders href preserving only meaningful filters.
 */
function buildWorkOrdersHref({
  search,
  status,
}: {
  search?: string;
  status?: WorkOrderStatus;
}): string {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (status) {
    params.set("status", status);
  }

  const queryString = params.toString();

  return queryString ? `/work-orders?${queryString}` : "/work-orders";
}

/**
 * Returns true when the work order belongs to the active operational flow.
 */
function isActiveWorkOrder(workOrder: WorkOrder): boolean {
  return (
    workOrder.status === "PENDING" ||
    workOrder.status === "IN_PROGRESS" ||
    workOrder.status === "READY"
  );
}

/**
 * Normalizes a Next.js search param into a single trimmed string.
 */
function normalizeSearchParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return (value[0] ?? "").trim();
  }

  return (value ?? "").trim();
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

/**
 * Normalizes a work order status search param.
 */
function normalizeStatusParam(
  value: string | string[] | undefined,
): WorkOrderStatus | undefined {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (WORK_ORDER_STATUSES.some((status) => status === rawValue)) {
    return rawValue as WorkOrderStatus;
  }

  return undefined;
}

/**
 * Returns a title for the current list state.
 */
function getResultsTitle(
  status: WorkOrderStatus | undefined,
  hasSearch: boolean,
): string {
  if (hasSearch) {
    return "Resultados";
  }

  if (status) {
    return `Órdenes ${formatWorkOrderStatus(status).toLowerCase()}`;
  }

  return "Últimas órdenes";
}

/**
 * Converts API money values into numbers for compact page summaries.
 */
function moneyToNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  return 0;
}

/**
 * Joins class names while ignoring empty values.
 */
function buildClassName(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
