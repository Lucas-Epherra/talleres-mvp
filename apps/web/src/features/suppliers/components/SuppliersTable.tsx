import {
  Eye,
  PackageSearch,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatMoney } from "../../../lib/format";
import type { SupplierListItem } from "../types";
import { SupplierCard } from "./SupplierCard";

type SuppliersTableProps = {
  suppliers: SupplierListItem[];
};

/**
 * Responsive supplier register.
 *
 * Desktop uses a compact planilla for fast comparison. Smaller screens keep
 * the card layout so financial data and actions remain legible without
 * horizontal scrolling.
 */
export function SuppliersTable({ suppliers }: SuppliersTableProps) {
  return (
    <>
      <div className="grid gap-3.5 lg:hidden">
        {suppliers.map((supplier, index) => (
          <SupplierCard
            key={supplier.id}
            supplier={supplier}
            variant={index % 2 === 0 ? "accent" : "neutral"}
          />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-[1.35rem] border border-border bg-surface shadow-(--shadow-industrial) ring-1 ring-white/3 lg:block">
        <table className="w-full table-fixed border-collapse text-left">
          <caption className="sr-only">
            Planilla comparativa de proveedores del taller
          </caption>

          <thead className="bg-surface-muted/90">
            <tr className="border-b border-border">
              <TableHeading className="w-[24%]">Proveedor</TableHeading>
              <TableHeading className="w-[17%]">Categorías</TableHeading>
              <TableHeading align="right" className="w-[11%]">
                Comprado
              </TableHeading>
              <TableHeading align="right" className="w-[10%]">
                Abonado
              </TableHeading>
              <TableHeading align="right" className="w-[11%]">
                Deuda
              </TableHeading>
              <TableHeading align="right" className="w-[11%]">
                Margen
              </TableHeading>
              <TableHeading align="right" className="w-[16%]">
                Acciones
              </TableHeading>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {suppliers.map((supplier) => (
              <SupplierTableRow key={supplier.id} supplier={supplier} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SupplierTableRow({ supplier }: { supplier: SupplierListItem }) {
  const isArchived = Boolean(supplier.archivedAt);
  const pendingBalance = toNumber(supplier.metrics.pendingBalance);
  const hasDebt = pendingBalance > 0;

  return (
    <tr
      className={buildClassName(
        "group align-top transition-colors hover:bg-surface-elevated/70",
        isArchived ? "bg-surface-muted/35 text-muted-foreground" : "bg-surface",
      )}
    >
      <TableCell>
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden="true"
            className={buildClassName(
              "mt-1 h-10 w-1 shrink-0 rounded-full",
              isArchived
                ? "bg-muted-foreground/45"
                : hasDebt
                  ? "bg-warning/75"
                  : "bg-primary/50",
            )}
          />

          <div className="min-w-0">
            <Link
              href={`/suppliers/${supplier.id}`}
              className="wrap-anywhere font-display text-base font-black uppercase tracking-[0.03em] text-foreground transition group-hover:text-primary"
            >
              {supplier.name}
            </Link>

            <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">
              {supplier.contactName ?? supplier.phone ?? "Sin contacto cargado"}
            </p>

            <p className="mt-2 text-[0.62rem] font-black uppercase tracking-[0.14em] text-muted-foreground">
              {supplier._count.workOrderPartLines} línea
              {supplier._count.workOrderPartLines === 1 ? "" : "s"} de orden
              {isArchived ? " · Archivado" : ""}
            </p>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex flex-wrap gap-1.5">
          {supplier.categories.length > 0 ? (
            <>
              {supplier.categories.slice(0, 3).map((category) => (
                <span
                  key={category.id}
                  className="inline-flex max-w-full truncate rounded-full border border-border-strong bg-surface-muted px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-[0.12em] text-muted-foreground"
                >
                  {category.name}
                </span>
              ))}

              {supplier.categories.length > 3 ? (
                <span className="inline-flex rounded-full border border-border bg-surface px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-[0.12em] text-muted-foreground">
                  +{supplier.categories.length - 3}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-xs font-semibold text-muted-foreground">
              Sin categoría
            </span>
          )}
        </div>
      </TableCell>

      <MoneyCell value={supplier.metrics.purchasedTotal} />
      <MoneyCell value={supplier.metrics.paidTotal} />
      <MoneyCell
        value={supplier.metrics.pendingBalance}
        tone={hasDebt ? "warning" : "neutral"}
      />
      <MoneyCell
        value={supplier.metrics.grossProfitTotal}
        tone={toNumber(supplier.metrics.grossProfitTotal) > 0 ? "positive" : "neutral"}
      />

      <TableCell align="right">
        <div className="ml-auto grid max-w-[11rem] gap-1.5">
          <Link
            href={`/suppliers/${supplier.id}`}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-xs font-bold text-white transition hover:bg-primary-hover"
          >
            <Eye className="size-3.5 shrink-0" aria-hidden="true" />
            Ver ficha
          </Link>

          <div className="grid grid-cols-2 gap-1.5">
            <Link
              href={`/suppliers/${supplier.id}/edit`}
              aria-label={`Editar proveedor ${supplier.name}`}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border-strong bg-surface-muted px-2 text-xs font-bold text-foreground transition hover:border-primary/60 hover:bg-surface"
            >
              <Pencil className="size-3.5 shrink-0" aria-hidden="true" />
              Editar
            </Link>

            <Link
              href={`/suppliers/${supplier.id}#supplier-parts-heading`}
              aria-label={`Ver repuestos de ${supplier.name}`}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border-strong bg-surface-muted px-2 text-xs font-bold text-foreground transition hover:border-primary/60 hover:bg-surface"
            >
              <PackageSearch className="size-3.5 shrink-0" aria-hidden="true" />
              Catálogo
            </Link>
          </div>
        </div>
      </TableCell>
    </tr>
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
        "px-4 py-3 text-[0.62rem] font-black uppercase tracking-[0.16em] text-muted-foreground",
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
        "px-4 py-4",
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
  tone?: "neutral" | "warning" | "positive";
}) {
  return (
    <TableCell align="right">
      <span
        className={buildClassName(
          "whitespace-nowrap text-sm font-black tabular-nums",
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

function toNumber(value: number | string | null | undefined): number {
  const parsedValue = Number(value ?? 0);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function buildClassName(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
