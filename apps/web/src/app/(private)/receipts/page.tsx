import {
  ArrowLeft,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  MailCheck,
  ReceiptText,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState } from "../../../components/ui/EmptyState";
import { getReceipts } from "../../../features/receipts/receipts.server";
import type {
  Receipt,
  ReceiptEmailStatus,
  ReceiptsPaginationMeta,
  ReceiptsQuery,
} from "../../../features/receipts/types";
import { env } from "../../../lib/env";
import {
  formatDateTime,
  formatMileage,
  formatMoney,
  formatReceiptNumber,
  normalizeSearchParam,
} from "../../../lib/format";

type ReceiptsPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    emailStatus?: string | string[];
    issuedFrom?: string | string[];
    issuedTo?: string | string[];
    page?: string | string[];
    limit?: string | string[];
  }>;
};

type ReceiptListFilters = {
  search: string;
  emailStatus: ReceiptEmailStatus | "";
  issuedFrom: string;
  issuedTo: string;
  page: number;
  limit: number;
};

export const metadata: Metadata = {
  title: "Recibos",
};

/**
 * Main receipts section.
 *
 * Lists issued internal receipts with filters, email status and quick actions.
 */
export default async function ReceiptsPage({ searchParams }: ReceiptsPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseReceiptListFilters(resolvedSearchParams);

  const receiptsPage = await getReceipts({
    search: filters.search || undefined,
    emailStatus: filters.emailStatus || undefined,
    issuedFrom: filters.issuedFrom || undefined,
    issuedTo: filters.issuedTo || undefined,
    page: filters.page,
    limit: filters.limit,
  });

  const hasActiveFilters =
    filters.search.length > 0 ||
    filters.emailStatus.length > 0 ||
    filters.issuedFrom.length > 0 ||
    filters.issuedTo.length > 0;

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div
          aria-hidden="true"
          className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-12 rounded-full bg-primary/15 blur-3xl"
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              Cobro y comprobantes
            </p>

            <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
              Recibos internos
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Consultá los recibos emitidos por el taller, revisá su estado de
              envío y accedé rápido al PDF, a la orden asociada o al detalle del
              comprobante.
            </p>
          </div>

          <div className="shrink-0">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-border-strong bg-surface-muted px-4 py-2 text-sm font-bold text-foreground">
              <ReceiptText
                className="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              {receiptsPage.meta.totalItems} recibo
              {receiptsPage.meta.totalItems === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <ReceiptFiltersForm filters={filters} hasActiveFilters={hasActiveFilters} />
      </header>

      {receiptsPage.data.length > 0 ? (
        <>
          <div className="grid gap-4">
            {receiptsPage.data.map((receipt) => (
              <ReceiptListCard key={receipt.id} receipt={receipt} />
            ))}
          </div>

          <ReceiptsPagination filters={filters} meta={receiptsPage.meta} />
        </>
      ) : (
        <EmptyState
          eyebrow={hasActiveFilters ? "Sin resultados" : "Recibos"}
          title={
            hasActiveFilters
              ? "No encontramos recibos con esos filtros"
              : "Todavía no hay recibos emitidos"
          }
          description={
            hasActiveFilters
              ? "Probá limpiar la búsqueda, ampliar el rango de fechas o cambiar el estado de envío."
              : "Cuando emitas recibos desde una orden de trabajo, van a aparecer en esta sección con acceso al PDF y a la orden asociada."
          }
          actions={[
            ...(hasActiveFilters
              ? [
                  {
                    label: "Limpiar filtros",
                    href: "/receipts",
                    variant: "secondary" as const,
                  },
                ]
              : []),
            {
              label: "Ver órdenes",
              href: "/work-orders",
              variant: "primary" as const,
            },
          ]}
        />
      )}
    </section>
  );
}

function ReceiptFiltersForm({
  filters,
  hasActiveFilters,
}: {
  filters: ReceiptListFilters;
  hasActiveFilters: boolean;
}) {
  return (
    <form className="relative mt-6 rounded-[1.1rem] border border-border bg-surface/80 p-3 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:rounded-[1.35rem] sm:p-4">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="size-4 text-primary" aria-hidden="true" />

        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          Filtros
        </p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_160px_160px_auto_auto]">
        <div className="grid gap-2">
          <label
            htmlFor="receipts-search"
            className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-steel"
          >
            Buscar
          </label>

          <input
            id="receipts-search"
            name="search"
            type="search"
            defaultValue={filters.search}
            placeholder="Cliente, patente, email, recibo u orden"
            className="h-12 min-h-12 w-full min-w-0 appearance-none rounded-xl border border-border-strong bg-background/70 px-4 py-3 text-sm leading-5 text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="receipts-email-status"
            className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-steel"
          >
            Envío
          </label>

          <select
            id="receipts-email-status"
            name="emailStatus"
            defaultValue={filters.emailStatus}
            className="h-12 min-h-12 rounded-xl border border-border-strong bg-background/70 px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Todos</option>
            <option value="sent">Enviados</option>
            <option value="not_sent">No enviados</option>
          </select>
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="receipts-issued-from"
            className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-steel"
          >
            Desde
          </label>

          <input
            id="receipts-issued-from"
            name="issuedFrom"
            type="date"
            defaultValue={filters.issuedFrom}
            className="h-12 min-h-12 rounded-xl border border-border-strong bg-background/70 px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="receipts-issued-to"
            className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-steel"
          >
            Hasta
          </label>

          <input
            id="receipts-issued-to"
            name="issuedTo"
            type="date"
            defaultValue={filters.issuedTo}
            className="h-12 min-h-12 rounded-xl border border-border-strong bg-background/70 px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <input type="hidden" name="limit" value={filters.limit} />

        <div className="grid gap-2 lg:self-end">
          <span className="hidden text-[0.68rem] font-bold uppercase tracking-[0.18em] text-transparent lg:block">
            Acción
          </span>

          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover lg:w-auto"
          >
            <Search className="size-4 shrink-0" aria-hidden="true" />
            Buscar
          </button>
        </div>

        {hasActiveFilters ? (
          <div className="grid gap-2 lg:self-end">
            <span className="hidden text-[0.68rem] font-bold uppercase tracking-[0.18em] text-transparent lg:block">
              Limpiar
            </span>

            <Link
              href="/receipts"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated lg:w-auto"
            >
              Limpiar
            </Link>
          </div>
        ) : null}
      </div>
    </form>
  );
}

function ReceiptListCard({ receipt }: { receipt: Receipt }) {
  const customer = receipt.customerSnapshot;
  const vehicle = receipt.vehicleSnapshot;
  const work = receipt.workSnapshot;
  const receiptNumber = formatReceiptNumber(receipt.receiptNumber);
  const pdfUrl = `${env.apiBaseUrl}/receipts/${receipt.id}/pdf`;

  return (
    <article className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-5 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                Recibo #{receiptNumber}
              </p>

              <h2 className="mt-2 wrap-anywhere font-display text-xl font-black uppercase tracking-[0.04em] text-foreground">
                {customer.fullName}
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Orden #{work.orderNumber} · {vehicle.brand} {vehicle.model} ·{" "}
                {vehicle.licensePlate}
              </p>
            </div>

            <ReceiptEmailBadge receipt={receipt} />
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ReceiptMetric label="Emitido" value={formatDateTime(receipt.issuedAt)} />
            <ReceiptMetric label="Total" value={formatMoney(receipt.total)} />
            <ReceiptMetric
              label="Kilometraje"
              value={formatMileage(vehicle.mileage)}
            />
            <ReceiptMetric
              label="Email"
              value={receipt.emailTo ?? customer.email ?? "Sin email"}
            />
          </dl>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:w-90 xl:grid-cols-1">
          <Link
            href={`/receipts/${receipt.id}`}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover"
          >
            <ReceiptText className="size-4 shrink-0" aria-hidden="true" />
            Ver recibo
          </Link>

          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
          >
            <Download className="size-4 shrink-0" aria-hidden="true" />
            Descargar PDF
          </a>

          <Link
            href={`/work-orders/${receipt.workOrderId}`}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
            Ver orden
          </Link>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm leading-6 text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center">
        <span className="inline-flex items-center gap-2">
          <CarFront className="size-4 text-primary" aria-hidden="true" />
          Patente {vehicle.licensePlate}
        </span>

        <span className="hidden text-border-strong sm:inline">·</span>

        <span>Ingreso: {formatDateTime(work.entryDate)}</span>
      </div>
    </article>
  );
}

function ReceiptEmailBadge({ receipt }: { receipt: Receipt }) {
  if (receipt.emailedAt) {
    return (
      <p className="inline-flex w-fit items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-success">
        <MailCheck className="size-3.5" aria-hidden="true" />
        Enviado
      </p>
    );
  }

  return (
    <p className="inline-flex w-fit items-center gap-2 rounded-full border border-border-strong bg-surface-muted px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
      <Mail className="size-3.5" aria-hidden="true" />
      No enviado
    </p>
  );
}

function ReceiptMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/75 p-4">
      <dt className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-steel">
        {label}
      </dt>

      <dd className="mt-2 wrap-anywhere text-sm font-bold leading-6 text-foreground">
        {value}
      </dd>
    </div>
  );
}

function ReceiptsPagination({
  filters,
  meta,
}: {
  filters: ReceiptListFilters;
  meta: ReceiptsPaginationMeta;
}) {
  if (meta.totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Paginación de recibos"
      className="flex flex-col gap-3 rounded-[1.1rem] border border-border bg-surface/80 p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm font-semibold text-muted-foreground">
        Página{" "}
        <span className="font-bold text-foreground">{meta.page}</span> de{" "}
        <span className="font-bold text-foreground">{meta.totalPages}</span>
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {meta.hasPreviousPage ? (
          <Link
            href={buildReceiptsHref(filters, meta.page - 1)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Anterior
          </Link>
        ) : (
          <span className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface-muted px-5 text-sm font-bold text-muted-foreground opacity-60">
            <ChevronLeft className="size-4" aria-hidden="true" />
            Anterior
          </span>
        )}

        {meta.hasNextPage ? (
          <Link
            href={buildReceiptsHref(filters, meta.page + 1)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
          >
            Siguiente
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        ) : (
          <span className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface-muted px-5 text-sm font-bold text-muted-foreground opacity-60">
            Siguiente
            <ChevronRight className="size-4" aria-hidden="true" />
          </span>
        )}
      </div>
    </nav>
  );
}

function parseReceiptListFilters(
  searchParams: Awaited<ReceiptsPageProps["searchParams"]>,
): ReceiptListFilters {
  const rawEmailStatus = normalizeSearchParam(searchParams.emailStatus);
  const emailStatus = isReceiptEmailStatus(rawEmailStatus) ? rawEmailStatus : "";

  return {
    search: normalizeSearchParam(searchParams.search),
    emailStatus,
    issuedFrom: normalizeSearchParam(searchParams.issuedFrom),
    issuedTo: normalizeSearchParam(searchParams.issuedTo),
    page: normalizePositiveInteger(normalizeSearchParam(searchParams.page), 1, 1, 9999),
    limit: normalizePositiveInteger(normalizeSearchParam(searchParams.limit), 10, 1, 50),
  };
}

function normalizePositiveInteger(
  value: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const numericValue = Number(value);

  if (!Number.isInteger(numericValue)) {
    return fallback;
  }

  if (numericValue < min) {
    return fallback;
  }

  return Math.min(numericValue, max);
}

function isReceiptEmailStatus(value: string): value is ReceiptEmailStatus {
  return value === "sent" || value === "not_sent";
}

function buildReceiptsHref(filters: ReceiptListFilters, page: number): string {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.emailStatus) {
    params.set("emailStatus", filters.emailStatus);
  }

  if (filters.issuedFrom) {
    params.set("issuedFrom", filters.issuedFrom);
  }

  if (filters.issuedTo) {
    params.set("issuedTo", filters.issuedTo);
  }

  if (filters.limit !== 10) {
    params.set("limit", filters.limit.toString());
  }

  if (page > 1) {
    params.set("page", page.toString());
  }

  const queryString = params.toString();

  return queryString ? `/receipts?${queryString}` : "/receipts";
}
