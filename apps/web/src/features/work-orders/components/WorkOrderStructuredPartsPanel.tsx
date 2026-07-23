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
 * A compact planilla is used when enough width is available. Smaller screens
 * keep touch-friendly cards without forcing horizontal scrolling.
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
                Costos internos, precio al cliente y margen de cada compra
                vinculada a la orden.
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:min-w-lg xl:grid-cols-4">
            <SummaryMetric
              label="Líneas"
              value={partLines.length.toString()}
              icon={<Boxes className="size-3.5" aria-hidden="true" />}
            />
            <SummaryMetric
              label="Costo proveedor"
              value={formatMoney(summary.supplierCost)}
              icon={<Truck className="size-3.5" aria-hidden="true" />}
            />
            <SummaryMetric
              label="Precio cliente"
              value={formatMoney(summary.customerPrice)}
              icon={<BadgeDollarSign className="size-3.5" aria-hidden="true" />}
            />
            <SummaryMetric
              label="Margen"
              value={formatMoney(summary.grossProfit)}
              icon={<Scale className="size-3.5" aria-hidden="true" />}
              tone={summary.grossProfit < 0 ? "warning" : "accent"}
            />
          </div>
        </div>
      </header>

      <div className="border-t border-border bg-surface-muted/35 p-4 sm:p-5">
        <div className="grid gap-3 xl:hidden">
          {partLines.map((partLine, index) => (
            <StructuredPartLineCard
              key={partLine.id}
              partLine={partLine}
              position={index + 1}
            />
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface xl:block">
          <table className="w-full table-fixed border-collapse text-left">
            <caption className="sr-only">
              Planilla de repuestos estructurados de la orden
            </caption>

            <thead className="bg-surface-muted/75">
              <tr className="border-b border-border">
                <TableHeading className="w-[27%]">Repuesto</TableHeading>
                <TableHeading className="w-[17%]">Proveedor</TableHeading>
                <TableHeading align="right" className="w-[8%]">
                  Cant.
                </TableHeading>
                <TableHeading align="right" className="w-[12%]">
                  Costo unit.
                </TableHeading>
                <TableHeading align="right" className="w-[13%]">
                  Costo total
                </TableHeading>
                <TableHeading align="right" className="w-[13%]">
                  Cliente
                </TableHeading>
                <TableHeading align="right" className="w-[10%]">
                  Margen
                </TableHeading>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {partLines.map((partLine, index) => (
                <StructuredPartLineRow
                  key={partLine.id}
                  partLine={partLine}
                  position={index + 1}
                  rowIndex={index}
                />
              ))}
            </tbody>
          </table>
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

function SummaryMetric({
  label,
  value,
  icon,
  tone = "neutral",
}: SummaryMetricProps) {
  return (
    <div
      className={buildClassName(
        "rounded-xl border px-3 py-2.5",
        tone === "warning"
          ? "border-warning/40 bg-warning/10"
          : tone === "accent"
            ? "border-primary/20 bg-primary/4.5"
            : "border-border bg-surface-muted/75",
      )}
    >
      <p
        className={buildClassName(
          "flex items-center gap-1.5 text-[0.57rem] font-black uppercase tracking-[0.15em]",
          tone === "warning" ? "text-warning" : "text-primary",
        )}
      >
        {icon}
        {label}
      </p>

      <p className="mt-1.5 whitespace-nowrap font-display text-[0.95rem] font-black text-foreground">
        {value}
      </p>
    </div>
  );
}

function StructuredPartLineRow({
  partLine,
  position,
  rowIndex,
}: {
  partLine: WorkOrderPartLine;
  position: number;
  rowIndex: number;
}) {
  const supplierName = getSupplierName(partLine);
  const categoryName = partLine.supplierPart?.category?.name ?? null;
  const sku = partLine.supplierPart?.sku ?? null;
  const grossProfit = toNumber(partLine.grossProfit);

  return (
    <tr
      className={buildClassName(
        "align-middle transition-colors hover:bg-primary/[0.035]",
        rowIndex % 2 === 0 ? "bg-surface" : "bg-surface-muted/18",
      )}
    >
      <TableCell>
        <div className="min-w-0">
          <p className="text-[0.56rem] font-black uppercase tracking-[0.15em] text-primary">
            Línea {position}
          </p>
          <p className="mt-1 wrap-anywhere text-sm font-black text-foreground">
            {partLine.partNameSnapshot}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-[0.68rem] font-semibold text-muted-foreground">
            {categoryName ? <span>{categoryName}</span> : null}
            {sku ? <span>SKU {sku}</span> : null}
            <span>{formatMarkup(partLine.markupType, partLine.markupValue)}</span>
            <span>{formatPurchaseDate(partLine.purchasedAt)}</span>
          </div>
          {partLine.notes ? (
            <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
              {partLine.notes}
            </p>
          ) : null}
        </div>
      </TableCell>

      <TableCell>
        {partLine.supplier ? (
          <Link
            href={`/suppliers/${partLine.supplier.id}`}
            className="wrap-anywhere text-xs font-black text-foreground underline decoration-transparent underline-offset-4 transition hover:text-primary hover:decoration-primary"
          >
            {supplierName}
          </Link>
        ) : (
          <span className="text-xs font-bold text-muted-foreground">
            {supplierName}
          </span>
        )}
      </TableCell>

      <NumericCell value={formatQuantity(partLine.quantity)} />
      <MoneyCell value={partLine.supplierUnitCost} />
      <MoneyCell value={partLine.supplierSubtotal} />
      <MoneyCell value={partLine.customerSubtotal} />
      <MoneyCell
        value={partLine.grossProfit}
        tone={grossProfit < 0 ? "warning" : grossProfit > 0 ? "positive" : "neutral"}
      />
    </tr>
  );
}

type StructuredPartLineCardProps = {
  partLine: WorkOrderPartLine;
  position: number;
};

function StructuredPartLineCard({
  partLine,
  position,
}: StructuredPartLineCardProps) {
  const supplierName = getSupplierName(partLine);
  const categoryName = partLine.supplierPart?.category?.name ?? null;
  const sku = partLine.supplierPart?.sku ?? null;

  return (
    <article className="rounded-2xl border border-border bg-surface p-4 transition hover:border-primary/25">
      <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[0.59rem] font-black uppercase tracking-[0.16em] text-primary">
            Repuesto {position}
          </p>
          <h3 className="mt-1.5 wrap-anywhere font-display text-base font-black uppercase tracking-wide text-foreground">
            {partLine.partNameSnapshot}
          </h3>
          <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-xs font-semibold text-muted-foreground">
            <span>Cantidad {formatQuantity(partLine.quantity)}</span>
            {categoryName ? <span>{categoryName}</span> : null}
            {sku ? <span>SKU {sku}</span> : null}
          </div>
        </div>

        <div className="shrink-0 sm:text-right">
          <p className="text-[0.56rem] font-black uppercase tracking-[0.15em] text-muted-foreground">
            Proveedor
          </p>
          {partLine.supplier ? (
            <Link
              href={`/suppliers/${partLine.supplier.id}`}
              className="mt-1 inline-flex text-sm font-black text-foreground underline decoration-transparent underline-offset-4 transition hover:text-primary hover:decoration-primary"
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

      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        <PartMetric label="Costo proveedor" value={formatMoney(partLine.supplierSubtotal)} />
        <PartMetric label="Precio cliente" value={formatMoney(partLine.customerSubtotal)} />
        <PartMetric label="Costo unitario" value={formatMoney(partLine.supplierUnitCost)} />
        <PartMetric
          label="Margen"
          value={formatMoney(partLine.grossProfit)}
          tone={toNumber(partLine.grossProfit) < 0 ? "warning" : "accent"}
        />
      </dl>

      <div className="mt-3 flex flex-col gap-1.5 rounded-xl border border-border bg-surface-muted/60 px-3 py-2 text-xs font-semibold text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>{formatMarkup(partLine.markupType, partLine.markupValue)}</span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="size-3.5 text-primary" aria-hidden="true" />
          {formatPurchaseDate(partLine.purchasedAt)}
        </span>
      </div>

      {partLine.notes ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          <span className="font-bold text-foreground">Nota:</span>{" "}
          {partLine.notes}
        </p>
      ) : null}
    </article>
  );
}

function PartMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "accent" | "warning";
}) {
  return (
    <div
      className={buildClassName(
        "rounded-xl border px-3 py-2.5",
        tone === "warning"
          ? "border-warning/35 bg-warning/10"
          : tone === "accent"
            ? "border-primary/18 bg-primary/4"
            : "border-border bg-surface-muted/65",
      )}
    >
      <dt className="text-[0.56rem] font-black uppercase tracking-[0.15em] text-primary">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-black text-foreground">{value}</dd>
    </div>
  );
}

function TableHeading({
  children,
  align = "left",
  className,
}: {
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={buildClassName(
        "px-3 py-3.5 text-[0.56rem] font-black uppercase tracking-[0.14em] text-muted-foreground",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      className={buildClassName(
        "px-3 py-3.5",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {children}
    </td>
  );
}

function MoneyCell({
  value,
  tone = "neutral",
}: {
  value: number | string;
  tone?: "neutral" | "positive" | "warning";
}) {
  return (
    <TableCell align="right">
      <span
        className={buildClassName(
          "whitespace-nowrap text-xs font-black tabular-nums",
          tone === "warning"
            ? "text-warning"
            : tone === "positive"
              ? "text-primary"
              : "text-foreground",
        )}
      >
        {formatMoney(value)}
      </span>
    </TableCell>
  );
}

function NumericCell({ value }: { value: string }) {
  return (
    <TableCell align="right">
      <span className="whitespace-nowrap text-xs font-black tabular-nums text-foreground">
        {value}
      </span>
    </TableCell>
  );
}

function getSupplierName(partLine: WorkOrderPartLine): string {
  return (
    partLine.supplier?.name ??
    partLine.supplierNameSnapshot ??
    "Sin proveedor"
  );
}

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

function formatMarkup(
  markupType: SupplierMarkupType,
  markupValue: number | string | null,
): string {
  if (markupType === "NONE") {
    return "Sin recargo";
  }

  if (markupType === "PERCENTAGE") {
    return `${formatDecimal(markupValue)}% de recargo`;
  }

  if (markupType === "FIXED_AMOUNT") {
    return `Recargo ${formatMoney(markupValue)}`;
  }

  return "Precio manual";
}

function formatQuantity(value: number | string): string {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

function formatDecimal(value: number | string | null): string {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

function formatPurchaseDate(value: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
  }).format(new Date(value));
}

function toNumber(value: number | string | null | undefined): number {
  const parsedValue = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function buildClassName(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}