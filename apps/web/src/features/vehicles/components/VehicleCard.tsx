import Link from "next/link";
import { formatMileage } from "../../../lib/format";
import type { VehicleListItem } from "../types";

type VehicleCardVariant = "neutral" | "accent";

type VehicleCardProps = {
  vehicle: VehicleListItem;
  variant?: VehicleCardVariant;
};

/**
 * Displays a compact vehicle summary for large vehicle lists.
 *
 * Full vehicle, customer and work order details are available from the vehicle
 * profile, so this card only exposes the most relevant scanning information.
 */
export function VehicleCard({
  vehicle,
  variant = "neutral",
}: VehicleCardProps) {
  const workOrderCount = vehicle._count.workOrders;

  return (
    <article
      className={buildClassName(
        "relative overflow-hidden rounded-[1.1rem] border border-border p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 transition hover:border-primary/40 sm:rounded-[1.35rem] sm:p-5",
        getArticleClassName(variant),
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1 bg-primary/45"
      />

      <div
        aria-hidden="true"
        className="absolute right-0 top-0 h-28 w-28 translate-x-14 -translate-y-14 rounded-full bg-primary/10 blur-2xl"
      />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="min-w-0 flex-1">
          <header className="grid gap-3 border-b border-border pb-4 md:grid-cols-[minmax(0,1fr)_minmax(13rem,auto)] md:items-start">
            <VehiclePrimaryDatum
              eyebrow="Patente"
              value={vehicle.licensePlate}
              description={`${vehicle.brand} ${vehicle.model}`}
              size="large"
            />

            <VehiclePrimaryDatum
              eyebrow="Cliente asociado"
              value={vehicle.customer.fullName}
              description={vehicle.customer.phone}
              href={`/customers/${vehicle.customer.id}`}
              size="medium"
              align="right"
            />
          </header>

          <section
            aria-labelledby={`vehicle-summary-${vehicle.id}`}
            className="mt-4 grid gap-3 sm:grid-cols-3"
          >
            <h3 id={`vehicle-summary-${vehicle.id}`} className="sr-only">
              Resumen del vehículo
            </h3>

            <VehicleMetaItem
              label="Año"
              value={vehicle.year ? vehicle.year.toString() : "Sin cargar"}
            />

            <VehicleMetaItem
              label="Kilometraje"
              value={formatMileage(vehicle.mileage)}
            />

            <VehicleMetaItem
              label="Órdenes"
              value={`${workOrderCount} orden${
                workOrderCount === 1 ? "" : "es"
              }`}
            />
          </section>
        </div>

        <aside className="w-full shrink-0 lg:w-56">
          <div className="grid gap-2 rounded-2xl border border-border bg-surface-muted/80 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] sm:grid-cols-3 lg:flex lg:h-full lg:flex-col lg:justify-center lg:gap-3 lg:p-3">
            <Link
              href={`/vehicles/${vehicle.id}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-hover"
            >
              Abrir ficha
            </Link>

            <Link
              href={`/work-orders/new?vehicleId=${vehicle.id}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-elevated px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface"
            >
              Nueva orden
            </Link>

            <Link
              href={`/customers/${vehicle.customer.id}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-elevated px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface"
            >
              Ver cliente
            </Link>
          </div>
        </aside>
      </div>
    </article>
  );
}

type VehiclePrimaryDatumProps = {
  eyebrow: string;
  value: string;
  description: string;
  size: "large" | "medium";
  href?: string;
  align?: "left" | "right";
};

/**
 * Renders the main vehicle and customer fields used for quick scanning.
 */
function VehiclePrimaryDatum({
  eyebrow,
  value,
  description,
  size,
  href,
  align = "left",
}: VehiclePrimaryDatumProps) {
  const content = (
    <>
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primary">
        {eyebrow}
      </p>

      <p
        className={buildClassName(
          "mt-2 wrap-anywhere font-black text-foreground",
          size === "large"
            ? "font-display text-2xl uppercase tracking-[0.02em] sm:text-3xl"
            : "text-lg sm:text-xl",
        )}
      >
        {value}
      </p>

      <p className="mt-1 wrap-anywhere text-sm font-bold leading-5 text-muted-foreground">
        {description}
      </p>
    </>
  );

  const className = buildClassName(
    "block min-w-0 rounded-2xl border border-border bg-surface-elevated/80 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.64)] transition",
    href ? "hover:border-primary/45 hover:bg-surface" : "",
    align === "right" ? "md:text-right" : "",
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

/**
 * Compact metadata block for vehicle summary information.
 */
function VehicleMetaItem({ label, value }: { label: string; value: string }) {
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
function getArticleClassName(variant: VehicleCardVariant): string {
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
