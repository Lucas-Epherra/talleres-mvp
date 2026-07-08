import {
  Archive,
  Eye,
  PackageSearch,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { formatMoney } from "../../../lib/format";
import type { SupplierListItem } from "../types";

type SupplierCardVariant = "neutral" | "accent";

type SupplierCardProps = {
  supplier: SupplierListItem;
  variant?: SupplierCardVariant;
};

/**
 * Displays a supplier summary with the financial numbers that matter most for
 * purchasing: bought, paid, debt and estimated part margin.
 */
export function SupplierCard({
  supplier,
  variant = "neutral",
}: SupplierCardProps) {
  const isArchived = Boolean(supplier.archivedAt);
  const hasDebt = Number(supplier.metrics.pendingBalance) > 0;

  return (
    <article
      className={buildClassName(
        "relative overflow-hidden rounded-[1.1rem] border p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 transition sm:rounded-[1.35rem] sm:p-5",
        isArchived
          ? "border-border bg-linear-to-br from-surface-muted via-surface to-surface-muted hover:border-border-strong"
          : "border-border hover:border-primary/40",
        getArticleClassName(variant),
      )}
    >
      <div
        aria-hidden="true"
        className={buildClassName(
          "absolute inset-y-0 left-0 w-1",
          isArchived
            ? "bg-muted-foreground/45"
            : hasDebt
              ? "bg-warning/70"
              : "bg-primary/45",
        )}
      />

      <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-stretch">
        <div className="min-w-0">
          <header className="grid gap-3 border-b border-border pb-4 md:grid-cols-[minmax(0,1fr)_minmax(12rem,auto)] md:items-start">
            <SupplierPrimaryDatum
              eyebrow="Proveedor"
              value={supplier.name}
              size="large"
              isArchived={isArchived}
            />

            <SupplierPrimaryDatum
              eyebrow="Saldo pendiente"
              value={formatMoney(supplier.metrics.pendingBalance)}
              size="medium"
              align="right"
              isArchived={isArchived}
              tone={hasDebt ? "warning" : "neutral"}
            />
          </header>

          <div className="mt-4 flex flex-wrap gap-2">
            {supplier.categories.length > 0 ? (
              supplier.categories.slice(0, 4).map((category) => (
                <span
                  key={category.id}
                  className="inline-flex rounded-full border border-border-strong bg-surface-muted px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.16em] text-muted-foreground"
                >
                  {category.name}
                </span>
              ))
            ) : (
              <span className="inline-flex rounded-full border border-border bg-surface-muted px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                Sin categoría
              </span>
            )}

            {isArchived ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface-muted px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                <Archive className="size-3.5" aria-hidden="true" />
                Archivado
              </span>
            ) : null}
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SupplierSummaryItem
              label="Comprado"
              value={formatMoney(supplier.metrics.purchasedTotal)}
            />
            <SupplierSummaryItem
              label="Abonado"
              value={formatMoney(supplier.metrics.paidTotal)}
            />
            <SupplierSummaryItem
              label="Margen repuestos"
              value={formatMoney(supplier.metrics.grossProfitTotal)}
            />
            <SupplierSummaryItem
              label="Líneas de orden"
              value={`${supplier._count.workOrderPartLines} registro${
                supplier._count.workOrderPartLines === 1 ? "" : "s"
              }`}
            />
          </dl>
        </div>

        <aside className="w-full shrink-0">
          <div className="grid gap-2 rounded-2xl border border-border bg-surface-muted/80 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] sm:grid-cols-3 xl:flex xl:h-full xl:flex-col xl:justify-center xl:gap-3 xl:p-3">
            <Link
              href={`/suppliers/${supplier.id}`}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-hover"
            >
              <Eye className="size-4 shrink-0" aria-hidden="true" />
              Ver ficha
            </Link>

            <Link
              href={`/suppliers/${supplier.id}/edit`}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-elevated px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface"
            >
              <Pencil className="size-4 shrink-0" aria-hidden="true" />
              Editar
            </Link>

            <Link
              href={`/suppliers/${supplier.id}#supplier-parts-heading`}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-elevated px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface"
            >
              <PackageSearch className="size-4 shrink-0" aria-hidden="true" />
              Repuestos
            </Link>
          </div>
        </aside>
      </div>
    </article>
  );
}

type SupplierPrimaryDatumProps = {
  eyebrow: string;
  value: string;
  size: "large" | "medium";
  align?: "left" | "right";
  isArchived: boolean;
  tone?: "neutral" | "warning";
};

/**
 * Renders the key supplier identity or balance value for fast scanning.
 */
function SupplierPrimaryDatum({
  eyebrow,
  value,
  size,
  align = "left",
  isArchived,
  tone = "neutral",
}: SupplierPrimaryDatumProps) {
  return (
    <div
      className={buildClassName(
        "min-w-0 rounded-2xl border border-border bg-surface-elevated/80 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.64)]",
        align === "right" ? "md:text-right" : "",
      )}
    >
      <p
        className={buildClassName(
          "text-[0.65rem] font-bold uppercase tracking-[0.2em]",
          isArchived
            ? "text-muted-foreground"
            : tone === "warning"
              ? "text-warning"
              : "text-primary",
        )}
      >
        {eyebrow}
      </p>

      <p
        className={buildClassName(
          "mt-2 wrap-anywhere font-black text-foreground",
          size === "large"
            ? "font-display text-xl uppercase tracking-[0.02em] sm:text-2xl"
            : "text-lg sm:text-xl",
        )}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * Renders one compact metric inside a supplier list card.
 */
function SupplierSummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/85 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition hover:border-border-strong">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">
        {label}
      </p>

      <p className="mt-2 wrap-anywhere text-sm font-bold leading-5 text-foreground">
        {value}
      </p>
    </div>
  );
}

/**
 * Returns the card surface treatment for subtle visual alternation.
 */
function getArticleClassName(variant: SupplierCardVariant): string {
  if (variant === "accent") {
    return "bg-linear-to-br from-surface via-surface to-surface-elevated";
  }

  return "bg-linear-to-br from-surface-elevated via-surface to-surface";
}

/**
 * Small className join helper to avoid adding a dependency.
 */
function buildClassName(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
