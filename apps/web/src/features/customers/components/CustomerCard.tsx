import { Archive, CarFront, Eye, Pencil } from "lucide-react";
import Link from "next/link";
import type { CustomerListItem } from "../types";

type CustomerCardVariant = "neutral" | "accent";

type CustomerCardProps = {
  customer: CustomerListItem;
  variant?: CustomerCardVariant;
};

/**
 * Displays a compact customer summary for large customer lists.
 *
 * Full customer contact, vehicle and work order details are available from the
 * customer detail page, so this card only exposes key scanning information and
 * the vehicle count returned by the paginated backend endpoint.
 */
export function CustomerCard({
  customer,
  variant = "neutral",
}: CustomerCardProps) {
  const vehicleCount = customer._count.vehicles;
  const isArchived = Boolean(customer.archivedAt);

  return (
    <article
      className={buildClassName(
        "relative overflow-hidden rounded-[1.1rem] border p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 transition sm:rounded-[1.35rem] sm:p-5",
        isArchived
          ? "border-border bg-gradient-to-br from-surface-muted via-surface to-surface-muted hover:border-border-strong"
          : "border-border hover:border-primary/40",
        getArticleClassName(variant),
      )}
    >
      <div
        aria-hidden="true"
        className={buildClassName(
          "absolute inset-y-0 left-0 w-1",
          isArchived ? "bg-muted-foreground/45" : "bg-primary/45",
        )}
      />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="min-w-0 flex-1">
          <header className="grid gap-3 border-b border-border pb-4 md:grid-cols-[minmax(0,1fr)_minmax(13rem,auto)] md:items-start">
            <CustomerPrimaryDatum
              eyebrow="Cliente"
              value={customer.fullName}
              size="large"
              isArchived={isArchived}
            />

            <CustomerPrimaryDatum
              eyebrow="Teléfono"
              value={customer.phone}
              size="medium"
              align="right"
              isArchived={isArchived}
            />
          </header>

          {isArchived ? (
            <p className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-border-strong bg-surface-muted px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
              <Archive className="size-4 shrink-0" aria-hidden="true" />
              Cliente archivado
            </p>
          ) : null}

          <section
            aria-labelledby={`customer-summary-${customer.id}`}
            className="mt-4 grid gap-3 sm:grid-cols-3"
          >
            <h3 id={`customer-summary-${customer.id}`} className="sr-only">
              Resumen del cliente
            </h3>

            <CustomerSummaryItem
              label="Vehículos"
              value={`${vehicleCount} asociado${vehicleCount === 1 ? "" : "s"}`}
            />

            <CustomerSummaryItem
              label="Email"
              value={customer.email ?? "Sin cargar"}
            />

            <CustomerSummaryItem
              label="Dirección"
              value={customer.address ?? "Sin cargar"}
            />
          </section>
        </div>

        <aside className="w-full shrink-0 lg:w-56">
          <div className="grid gap-2 rounded-2xl border border-border bg-surface-muted/80 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] sm:grid-cols-3 lg:flex lg:h-full lg:flex-col lg:justify-center lg:gap-3 lg:p-3">
            <Link
              href={`/customers/${customer.id}`}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-hover"
            >
              <Eye className="size-4 shrink-0" aria-hidden="true" />
              Ver cliente
            </Link>

            <Link
              href={`/customers/${customer.id}/edit`}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-elevated px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface"
            >
              <Pencil className="size-4 shrink-0" aria-hidden="true" />
              Editar cliente
            </Link>

            {!isArchived ? (
              <Link
                href={`/vehicles/new?customerId=${customer.id}`}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-elevated px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface"
              >
                <CarFront className="size-4 shrink-0" aria-hidden="true" />
                Cargar vehículo
              </Link>
            ) : (
              <span className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-bold text-muted-foreground">
                <Archive className="size-4 shrink-0" aria-hidden="true" />
                Sin nuevos vehículos
              </span>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}

type CustomerPrimaryDatumProps = {
  eyebrow: string;
  value: string;
  size: "large" | "medium";
  align?: "left" | "right";
  isArchived: boolean;
};

/**
 * Renders the main customer identity fields used for quick scanning.
 */
function CustomerPrimaryDatum({
  eyebrow,
  value,
  size,
  align = "left",
  isArchived,
}: CustomerPrimaryDatumProps) {
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
          isArchived ? "text-muted-foreground" : "text-primary",
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
 * Renders a small customer summary datum.
 */
function CustomerSummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
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
function getArticleClassName(variant: CustomerCardVariant): string {
  if (variant === "accent") {
    return "bg-gradient-to-br from-surface via-surface to-surface-elevated";
  }

  return "bg-gradient-to-br from-surface-elevated via-surface to-surface";
}

/**
 * Small className join helper to avoid adding a dependency for this use case.
 */
function buildClassName(...classes: string[]): string {
  return classes.filter(Boolean).join(" ");
}
