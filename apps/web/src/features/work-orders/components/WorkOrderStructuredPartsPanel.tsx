import {
  BadgeDollarSign,
  Boxes,
  CalendarClock,
  PackageSearch,
  Scale,
  Truck,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatMoney } from "../../../lib/format";
import type {
  SupplierMarkupType,
  WorkOrderPartLine,
} from "../types";

type WorkOrderStructuredPartsPanelProps = {
  partLines: WorkOrderPartLine[];
};

/**
 * Displays structured supplier purchases attached to one work order.
 *
 * Supplier cost remains clearly separated from the customer-facing price so
 * debt, sale value and gross margin can be audited without reading form data.
 */
export function WorkOrderStructuredPartsPanel({
  partLines,
}: WorkOrderStructuredPartsPanelProps) {
  const summary = getStructuredPartsSummary(partLines);

  return (
    <section
      aria-labelledby="work-order-structured-parts-heading"
      className="overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated shadow-(--shadow-industrial) ring-1 ring-white/3"
    >
      <header className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted text-primary">
              <PackageSearch className="size-5" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                Compras y repuestos
              </p>

              <h2
                id="work-order-structured-parts-heading"
                className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
              >
                Repuestos de la orden
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Detalle de proveedores, cantidades, costo interno, precio al
                cliente y margen registrado para esta orden.
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[34rem] xl:grid-cols-4">
            <SummaryMetric
              label="Líneas"
              value={partLines.length.toString()}
              icon={<Boxes className="size-4" aria-hidden="true" />}
            />
            <SummaryMetric
              label="Costo proveedor"
              value={formatMoney(summary.supplierCost)}
              icon={<Truck className="size-4" aria-hidden="true" />}
            />
            <SummaryMetric
              label="Precio cliente"
              value={formatMoney(summary.customerPrice)}
              icon={<BadgeDollarSign className="size-4" aria-hidden="true" />}
            />
            <SummaryMetric
              label="Margen"
              value={formatMoney(summary.grossProfit)}
              icon={<Scale className="size-4" aria-hidden="true" />}
              tone={summary.grossProfit < 0 ? "warning" : "accent"}
            />
          </div>
        </div>
      </header>

      <div className="border-t border-border bg-surface-muted/45 p-4 sm:p-5">
        <div className="grid gap-3">
          {partLines.map((partLine, index) => (
            <StructuredPartLineCard
              key={partLine.id}
              partLine={partLine}
              position={index + 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

type SummaryMetricProps = {
  label: string;
  value: string;
  icon: ReactNode;
  tone?: "neutral" | "accent" | "warning";
};

/**
 * Compact financial metric used in the structured parts header.
 */
function SummaryMetric({
  label,
  value,
  icon,
  tone = "neutral",
}: SummaryMetricProps) {
  return (
    <div
      className={buildClassName(
        "rounded-2xl border px-3 py-2.5",
        tone === "warning"
          ? "border-warning/45 bg-warning/10"
          : tone === "accent"
            ? "border-primary/25 bg-primary/6"
            : "border-border bg-surface-muted/85",
      )}
    >
      <p
        className={buildClassName(
          "flex items-center gap-1.5 text-[0.6rem] font-black uppercase tracking-[0.16em]",
          tone === "warning" ? "text-warning" : "text-primary",
        )}
      >
        {icon}
        {label}
      </p>

      <p className="mt-1.5 font-display text-base font-black text-foreground">
        {value}
      </p>
    </div>
  );
}

type StructuredPartLineCardProps = {
  partLine: WorkOrderPartLine;
  position: number;
};

/**
 * One structured supplier part purchase shown inside the order detail.
 */
function StructuredPartLineCard({
  partLine,
  position,
}: StructuredPartLineCardProps) {
  const supplierName =
    partLine.supplier?.name ??
    partLine.supplierNameSnapshot ??
    "Sin proveedor";
  const categoryName = partLine.supplierPart?.category?.name ?? null;
  const sku = partLine.supplierPart?.sku ?? null;

  return (
    <article className="rounded-2xl border border-border bg-surface p-4 transition hover:border-primary/30 sm:p-5">
      <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-primary">
            Repuesto {position}
          </p>

          <h3 className="mt-2 wrap-anywhere font-display text-lg font-black uppercase tracking-[0.03em] text-foreground">
            {partLine.partNameSnapshot}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-muted-foreground">
            <span>
              Cantidad: {formatQuantity(partLine.quantity)}
            </span>

            {categoryName ? <span>{categoryName}</span> : null}
            {sku ? <span>SKU {sku}</span> : null}
          </div>
        </div>

        <div className="shrink-0 lg:text-right">
          <p className="text-[0.6rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
            Proveedor
          </p>

          {partLine.supplier ? (
            <Link
              href={`/suppliers/${partLine.supplier.id}`}
              className="mt-1 inline-flex wrap-anywhere text-sm font-black text-foreground underline decoration-transparent underline-offset-4 transition hover:text-primary hover:decoration-primary"
            >
              {supplierName}
            </Link>
          ) : (
            <p className="mt-1 text-sm font-black text-foreground">
              {supplierName}
            </p>
          )}
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PartMetric
          label="Costo unitario"
          value={formatMoney(partLine.supplierUnitCost)}
        />
        <PartMetric
          label="Costo proveedor"
          value={formatMoney(partLine.supplierSubtotal)}
        />
        <PartMetric
          label="Precio cliente"
          value={formatMoney(partLine.customerSubtotal)}
        />
        <PartMetric
          label="Margen"
          value={formatMoney(partLine.grossProfit)}
          tone={toNumber(partLine.grossProfit) < 0 ? "warning" : "accent"}
        />
      </dl>

      <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border bg-surface-muted/70 px-3 py-2.5 text-xs font-semibold text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <span>{formatMarkup(partLine.markupType, partLine.markupValue)}</span>

        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="size-3.5 text-primary" aria-hidden="true" />
          Compra registrada: {formatPurchaseDate(partLine.purchasedAt)}
        </span>
      </div>

      {partLine.notes ? (
        <p className="mt-3 rounded-xl border border-border bg-surface-muted/70 px-3 py-2.5 text-sm leading-6 text-muted-foreground">
          <span className="font-bold text-foreground">Nota:</span>{" "}
          {partLine.notes}
        </p>
      ) : null}
    </article>
  );
}

type PartMetricProps = {
  label: string;
  value: string;
  tone?: "neutral" | "accent" | "warning";
};

/**
 * Read-only monetary value for one structured part line.
 */
function PartMetric({
  label,
  value,
  tone = "neutral",
}: PartMetricProps) {
  return (
    <div
      className={buildClassName(
        "rounded-xl border px-3 py-2.5",
        tone === "warning"
          ? "border-warning/40 bg-warning/10"
          : tone === "accent"
            ? "border-primary/20 bg-primary/5"
            : "border-border bg-surface-muted/80",
      )}
    >
      <dt
        className={buildClassName(
          "text-[0.58rem] font-black uppercase tracking-[0.16em]",
          tone === "warning" ? "text-warning" : "text-primary",
        )}
      >
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-black text-foreground">{value}</dd>
    </div>
  );
}

/**
 * Aggregates order part-line totals without trusting legacy summary fields.
 */
function getStructuredPartsSummary(partLines: WorkOrderPartLine[]) {
  return partLines.reduce(
    (summary, partLine) => ({
      supplierCost: summary.supplierCost + toNumber(partLine.supplierSubtotal),
      customerPrice:
        summary.customerPrice + toNumber(partLine.customerSubtotal),
      grossProfit: summary.grossProfit + toNumber(partLine.grossProfit),
    }),
    {
      supplierCost: 0,
      customerPrice: 0,
      grossProfit: 0,
    },
  );
}

/**
 * Formats the markup saved with one historical part-line snapshot.
 */
function formatMarkup(
  markupType: SupplierMarkupType,
  markupValue: number | string | null,
): string {
  if (markupType === "NONE") {
    return "Sin recargo";
  }

  if (markupType === "PERCENTAGE") {
    return `Recargo: ${formatDecimal(markupValue)}%`;
  }

  if (markupType === "FIXED_AMOUNT") {
    return `Recargo fijo: ${formatMoney(markupValue)}`;
  }

  return "Precio al cliente cargado manualmente";
}

/**
 * Formats the quantity without unnecessary trailing zeroes.
 */
function formatQuantity(value: number | string): string {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

/**
 * Formats a general decimal without currency symbols.
 */
function formatDecimal(value: number | string | null): string {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

/**
 * Formats the historical purchase timestamp in the workshop locale.
 */
function formatPurchaseDate(value: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
  }).format(new Date(value));
}

/**
 * Converts Prisma decimal JSON values into safe numbers for display totals.
 */
function toNumber(value: number | string | null | undefined): number {
  const parsedValue = typeof value === "number" ? value : Number(value ?? 0);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

/**
 * Joins class names while ignoring empty values.
 */
function buildClassName(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
