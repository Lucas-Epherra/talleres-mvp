import Link from "next/link";
import type { WorkOrder } from "../types";
import { WorkOrderStatusMenu } from "./WorkOrderStatusMenu";

type WorkOrderCardVariant = "neutral" | "accent";

type WorkOrderCardProps = {
  workOrder: WorkOrder;
  variant?: WorkOrderCardVariant;
};

/**
 * Displays a compact work order summary for large work order lists.
 *
 * Full operational, financial and historical details are available from the
 * order detail page, so this card only exposes customer, vehicle and order
 * identification data.
 */
export function WorkOrderCard({
  workOrder,
  variant = "neutral",
}: WorkOrderCardProps) {
  const { vehicle, status } = workOrder;
  const customer = vehicle.customer;

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
        className="absolute right-0 top-0 h-28 w-28 translate-x-14 -translate-y-14 rounded-full bg-primary/8 blur-2xl"
      />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="grid gap-3 md:grid-cols-2">
            <SummaryContextBox
              label="Cliente"
              title={customer.fullName}
              description={customer.phone ?? "Sin teléfono"}
              href={`/customers/${customer.id}`}
            />

            <SummaryContextBox
              label="Vehículo"
              title={`${vehicle.brand} ${vehicle.model}`}
              description={vehicle.licensePlate}
              href={`/vehicles/${vehicle.id}`}
            />
          </div>

          <header className="mt-4 rounded-2xl border border-border bg-surface-muted/70 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.68)] sm:mt-5 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                  Orden #{workOrder.orderNumber}
                </p>

                <h2 className="mt-2 wrap-anywhere font-display text-lg font-black uppercase tracking-[0.04em] text-foreground sm:text-xl">
                  {workOrder.reportedIssue}
                </h2>
              </div>

              <div className="shrink-0 sm:text-right">
                <WorkOrderStatusMenu
                  workOrderId={workOrder.id}
                  orderNumber={workOrder.orderNumber}
                  currentStatus={status}
                />
              </div>
            </div>
          </header>
        </div>

        <aside className="w-full shrink-0 lg:w-56">
          <div className="grid gap-2 rounded-2xl border border-border bg-surface-muted/80 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] sm:grid-cols-2 lg:flex lg:h-full lg:flex-col lg:justify-center lg:gap-3 lg:p-3">
            <Link
              href={`/work-orders/${workOrder.id}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-[0_14px_35px_rgba(214,40,40,0.22)] transition hover:bg-primary-hover"
            >
              Ver orden
            </Link>

            <Link
              href={`/work-orders/${workOrder.id}/edit`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-elevated px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface"
            >
              Editar orden
            </Link>

            <Link
              href={`/vehicles/${vehicle.id}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-elevated px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface"
            >
              Ver ficha
            </Link>

            <Link
              href={`/customers/${customer.id}`}
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

type SummaryContextBoxProps = {
  label: string;
  title: string;
  description: string;
  href: string;
};

/**
 * Compact context block for the customer and vehicle linked to a work order.
 */
function SummaryContextBox({
  label,
  title,
  description,
  href,
}: SummaryContextBoxProps) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-border bg-surface-elevated/80 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.64)] transition hover:border-primary/45 hover:bg-surface"
    >
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
        {label}
      </p>

      <p className="mt-2 wrap-anywhere text-sm font-black text-foreground sm:text-base">
        {title}
      </p>

      <p className="mt-1 wrap-anywhere text-sm font-bold text-muted-foreground sm:text-base">
        {description}
      </p>
    </Link>
  );
}

/**
 * Returns the card surface treatment for subtle visual alternation.
 */
function getArticleClassName(variant: WorkOrderCardVariant): string {
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
