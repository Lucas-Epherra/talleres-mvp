import { ArrowUpRight, PackageSearch, Pencil } from "lucide-react";
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
 * Desktop uses a restrained planilla for fast financial comparison. Smaller
 * screens keep the card layout so actions remain usable without horizontal
 * scrolling.
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

          <thead className="bg-surface-muted/75">
            <tr className="border-b border-border">
              <TableHeading className="w-[29%]">Proveedor</TableHeading>
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
              <TableHeading align="right" className="w-[11%]">
                Acciones
              </TableHeading>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {suppliers.map((supplier, index) => (
              <SupplierTableRow
                key={supplier.id}
                supplier={supplier}
                rowIndex={index}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SupplierTableRow({
  supplier,
  rowIndex,
}: {
  supplier: SupplierListItem;
  rowIndex: number;
}) {
  const isArchived = Boolean(supplier.archivedAt);
  const pendingBalance = toNumber(supplier.metrics.pendingBalance);
  const hasDebt = pendingBalance > 0;
  const workOrderLines = supplier._count.workOrderPartLines;

  return (
    <tr
      className={buildClassName(
        "group align-middle transition-colors hover:bg-primary/[0.035]",
        rowIndex % 2 === 0 ? "bg-surface" : "bg-surface-muted/18",
        isArchived ? "text-muted-foreground opacity-80" : "",
      )}
    >
      <TableCell>
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className={buildClassName(
              "h-11 w-1 shrink-0 rounded-full",
              isArchived
                ? "bg-muted-foreground/35"
                : hasDebt
                  ? "bg-warning/70"
                  : "bg-primary/45",
            )}
          />

          <div className="min-w-0">
            <Link
              href={`/suppliers/${supplier.id}`}
              className="wrap-anywhere font-display text-[0.95rem] font-black uppercase tracking-wide text-foreground transition group-hover:text-primary"
            >
              {supplier.name}
            </Link>

            <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">
              {supplier.contactName ?? supplier.phone ?? "Sin contacto cargado"}
            </p>

            <p className="mt-1.5 text-[0.58rem] font-black uppercase tracking-[0.14em] text-muted-foreground">
              {workOrderLines} línea{workOrderLines === 1 ? "" : "s"} de orden
              {isArchived ? " · Archivado" : ""}
            </p>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex flex-wrap gap-1.5">
          {supplier.categories.length > 0 ? (
            <>
              {supplier.categories.slice(0, 1).map((category) => (
                <span
                  key={category.id}
                  className="inline-flex max-w-full truncate rounded-full border border-border-strong bg-surface-muted/80 px-2.5 py-1 text-[0.57rem] font-black uppercase tracking-[0.11em] text-muted-foreground"
                >
                  {category.name}
                </span>
              ))}

              {supplier.categories.length > 1 ? (
                <span className="inline-flex rounded-full border border-border bg-surface px-2.5 py-1 text-[0.57rem] font-black uppercase tracking-[0.11em] text-muted-foreground">
                  +{supplier.categories.length - 1}
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
        tone={
          toNumber(supplier.metrics.grossProfitTotal) > 0
            ? "positive"
            : "neutral"
        }
      />

      <TableCell align="right">
        <div className="ml-auto inline-flex items-center gap-1 rounded-xl border border-border bg-surface-muted/70 p-1">
          <Link
            href={`/suppliers/${supplier.id}`}
            aria-label={`Abrir ficha de ${supplier.name}`}
            title="Abrir ficha"
            className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>

          <Link
            href={`/suppliers/${supplier.id}/edit`}
            aria-label={`Editar proveedor ${supplier.name}`}
            title="Editar proveedor"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
          </Link>

          <Link
            href={`/suppliers/${supplier.id}#supplier-parts-heading`}
            aria-label={`Ver catálogo de ${supplier.name}`}
            title="Ver catálogo"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            <PackageSearch className="size-3.5" aria-hidden="true" />
          </Link>
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
        "px-4 py-3.5 text-[0.59rem] font-black uppercase tracking-[0.16em] text-muted-foreground",
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
        "px-4 py-3.5",
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
  const parsedValue = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function buildClassName(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}