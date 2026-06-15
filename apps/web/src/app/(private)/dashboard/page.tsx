import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "../../../components/ui/EmptyState";
import { getDashboardSummary } from "../../../features/dashboard/dashboard.server";
import {
  formatDate,
  formatMileage,
  formatMoney,
  formatWorkOrderStatus,
} from "../../../features/dashboard/utils";
import type { WorkOrderStatus } from "../../../features/dashboard/types";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * Private dashboard page.
 *
 * Shows the authenticated workshop operational summary using server-side data
 * fetching and httpOnly cookie forwarding.
 */
export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <section className="space-y-6 sm:space-y-8">
      <header className="rounded-[1.35rem] border border-border bg-surface/85 p-6 shadow-[var(--shadow-industrial)] ring-1 ring-white/[0.03] sm:p-8">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
          Resumen operativo
        </p>

        <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-white sm:text-3xl">
          Dashboard del taller
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Vista general de clientes, vehículos y órdenes de trabajo del taller
          autenticado.
        </p>
      </header>

      <section aria-labelledby="totals-heading" className="space-y-4">
        <SectionHeading
          headingId="totals-heading"
          eyebrow="Base operativa"
          title="Totales generales"
          description="Estado global del taller y volumen actual de registros."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            label="Clientes"
            value={summary.totals.customers}
            description="Clientes registrados"
            href="/customers"
          />
          <DashboardMetricCard
            label="Vehículos"
            value={summary.totals.vehicles}
            description="Vehículos asociados"
            href="/vehicles"
          />
          <DashboardMetricCard
            label="Órdenes"
            value={summary.totals.workOrders}
            description="Órdenes históricas"
            href="/work-orders"
          />
          <DashboardMetricCard
            label="En taller"
            value={summary.totals.vehiclesInWorkshop}
            description="Vehículos con trabajo activo"
            href="/work-orders"
            tone="primary"
          />
        </div>
      </section>

      <section aria-labelledby="work-orders-heading" className="space-y-4">
        <SectionHeading
          headingId="work-orders-heading"
          eyebrow="Flujo de trabajo"
          title="Estado de órdenes"
          description="Distribución actual de órdenes según avance operativo."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <DashboardMetricCard
            label="Activas"
            value={summary.workOrders.active}
            description="Pendientes, en progreso o listas"
            href="/work-orders"
            tone="primary"
          />
          <DashboardMetricCard
            label="Pendientes"
            value={summary.workOrders.pending}
            description="Aún sin iniciar"
            href="/work-orders?status=PENDING"
          />
          <DashboardMetricCard
            label="En progreso"
            value={summary.workOrders.inProgress}
            description="Trabajo en curso"
            href="/work-orders?status=IN_PROGRESS"
            tone="primary"
          />
          <DashboardMetricCard
            label="Listas"
            value={summary.workOrders.ready}
            description="Preparadas para entregar"
            href="/work-orders?status=READY"
            tone="warning"
          />
          <DashboardMetricCard
            label="Entregadas"
            value={summary.workOrders.delivered}
            description="Historial cerrado"
            href="/work-orders?status=DELIVERED"
            tone="success"
          />
        </div>
      </section>

      <section
        aria-labelledby="latest-work-orders-heading"
        className="overflow-hidden rounded-[1.35rem] border border-border bg-surface/85 shadow-[var(--shadow-industrial)] ring-1 ring-white/[0.03]"
      >
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              Actividad reciente
            </p>

            <h2
              id="latest-work-orders-heading"
              className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-white"
            >
              Últimas órdenes
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Movimientos recientes del taller.
            </p>
          </div>

          <Link
            href="/work-orders"
            className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated sm:w-auto"
          >
            Ver órdenes
          </Link>
        </div>

        {summary.latestWorkOrders.length > 0 ? (
          <>
            <div className="grid gap-4 p-5 xl:hidden">
              {summary.latestWorkOrders.map((workOrder) => (
                <LatestWorkOrderCard key={workOrder.id} workOrder={workOrder} />
              ))}
            </div>

            <div className="hidden xl:block">
              <table className="w-full text-left">
                <thead className="border-b border-border bg-background/35 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-6 py-4">
                      Orden
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Vehículo
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Cliente
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Ingreso
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Estimado
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {summary.latestWorkOrders.map((workOrder) => (
                    <tr
                      key={workOrder.id}
                      className="align-top transition hover:bg-background/30"
                    >
                      <td className="px-6 py-5">
                        <p className="font-display text-sm font-black uppercase tracking-[0.04em] text-white">
                          #{workOrder.orderNumber}
                        </p>

                        <p className="mt-1 max-w-xs break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">
                          {workOrder.reportedIssue}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-display text-sm font-black uppercase tracking-[0.04em] text-white">
                          {workOrder.vehicle.licensePlate}
                        </p>

                        <p className="mt-1 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
                          {workOrder.vehicle.brand} {workOrder.vehicle.model}
                        </p>

                        <p className="mt-1 text-xs text-steel">
                          {formatMileage(workOrder.vehicle.mileage)}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="break-words text-sm font-bold text-white [overflow-wrap:anywhere]">
                          {workOrder.vehicle.customer.fullName}
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {workOrder.vehicle.customer.phone ?? "Sin teléfono"}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge status={workOrder.status} />
                      </td>

                      <td className="px-6 py-5 text-sm text-muted-foreground">
                        {formatDate(workOrder.entryDate)}
                      </td>

                      <td className="px-6 py-5 text-sm font-bold text-white">
                        {formatMoney(workOrder.estimatedTotal)}
                      </td>

                      <td className="px-6 py-5">
                        <Link
                          href={`/work-orders/${workOrder.id}`}
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-3 text-xs font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated"
                        >
                          Ver orden
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="p-5 sm:p-6">
            <EmptyState
              eyebrow="Sin movimientos"
              title="Todavía no hay órdenes recientes"
              description="Cuando el taller empiece a registrar órdenes, los últimos movimientos van a aparecer acá. El flujo recomendado es crear la orden desde la ficha del vehículo."
              actions={[
                {
                  label: "Ir a vehículos",
                  href: "/vehicles",
                  variant: "primary",
                },
                {
                  label: "Ver órdenes",
                  href: "/work-orders",
                  variant: "secondary",
                },
              ]}
            />
          </div>
        )}
      </section>
    </section>
  );
}

type SectionHeadingProps = {
  headingId: string;
  eyebrow: string;
  title: string;
  description: string;
};

/**
 * Shared section heading for dashboard blocks.
 */
function SectionHeading({
  headingId,
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div>
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
        {eyebrow}
      </p>

      <h2
        id={headingId}
        className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-white"
      >
        {title}
      </h2>

      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

type DashboardMetricCardProps = {
  label: string;
  value: number;
  description: string;
  href?: string;
  tone?: "neutral" | "primary" | "warning" | "success";
};

/**
 * Small reusable metric card for dashboard summary values.
 *
 * When href is provided, the card becomes a navigable dashboard shortcut while
 * preserving the same visual structure as non-interactive metric cards.
 */
function DashboardMetricCard({
  label,
  value,
  description,
  href,
  tone = "neutral",
}: DashboardMetricCardProps) {
  const content = (
    <>
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-3 font-display text-3xl font-black text-white">
        {value}
      </p>

      <p className="mt-2 text-sm leading-5 text-muted-foreground">
        {description}
      </p>

      {href ? (
        <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-primary">
          Abrir
        </p>
      ) : null}
    </>
  );

  const className = `${getMetricCardClassName(
    tone,
  )} focus:outline-none focus:ring-2 focus:ring-primary/30`;

  if (href) {
    return (
      <Link href={href} aria-label={`Abrir ${label.toLowerCase()}`} className={className}>
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
}

type LatestWorkOrder = Awaited<
  ReturnType<typeof getDashboardSummary>
>["latestWorkOrders"][number];

type LatestWorkOrderCardProps = {
  workOrder: LatestWorkOrder;
};

/**
 * Mobile and tablet representation of a recent work order.
 *
 * It replaces the desktop table to avoid horizontal scrolling on narrow screens.
 */
function LatestWorkOrderCard({ workOrder }: LatestWorkOrderCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-background/55 p-5 ring-1 ring-white/[0.03]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-primary">
            Orden #{workOrder.orderNumber}
          </p>

          <h3 className="mt-2 break-words font-display text-base font-black uppercase leading-6 tracking-[0.04em] text-white [overflow-wrap:anywhere]">
            {workOrder.reportedIssue}
          </h3>
        </div>

        <StatusBadge status={workOrder.status} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <SmallDetail
          label="Vehículo"
          value={`${workOrder.vehicle.licensePlate} · ${workOrder.vehicle.brand} ${workOrder.vehicle.model}`}
        />
        <SmallDetail
          label="Cliente"
          value={workOrder.vehicle.customer.fullName}
        />
        <SmallDetail label="Ingreso" value={formatDate(workOrder.entryDate)} />
        <SmallDetail
          label="Estimado"
          value={formatMoney(workOrder.estimatedTotal)}
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/work-orders/${workOrder.id}`}
          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-[0_14px_35px_rgba(214,40,40,0.22)] transition hover:bg-primary-hover sm:w-auto"
        >
          Ver orden
        </Link>

        <Link
          href={`/vehicles/${workOrder.vehicle.id}`}
          className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated sm:w-auto"
        >
          Ver ficha
        </Link>
      </div>
    </article>
  );
}

type SmallDetailProps = {
  label: string;
  value: string;
};

/**
 * Compact label/value block for dashboard order cards.
 */
function SmallDetail({ label, value }: SmallDetailProps) {
  return (
    <div className="rounded-xl border border-border bg-surface/70 p-3 ring-1 ring-white/[0.03]">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-primary">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-bold text-white [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}

/**
 * Maps dashboard metric tones to branded card classes.
 */
function getMetricCardClassName(
  tone: DashboardMetricCardProps["tone"],
): string {
  const baseClassName =
    "group rounded-2xl border p-5 shadow-[var(--shadow-industrial)] ring-1 ring-white/[0.03] transition";

  if (tone === "primary") {
    return `${baseClassName} border-primary/35 bg-primary/10 hover:border-primary/60`;
  }

  if (tone === "warning") {
    return `${baseClassName} border-warning/35 bg-warning/10 hover:border-warning/60`;
  }

  if (tone === "success") {
    return `${baseClassName} border-success/35 bg-success/10 hover:border-success/60`;
  }

  return `${baseClassName} border-border bg-surface/85 hover:border-primary/40 hover:bg-surface-elevated`;
}

/**
 * Renders a compact visual status badge for a work order.
 */
function StatusBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <span
      className={`${getStatusBadgeClassName(status)} inline-flex w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em]`}
    >
      {formatWorkOrderStatus(status)}
    </span>
  );
}

/**
 * Maps order status to branded badge classes.
 */
function getStatusBadgeClassName(status: WorkOrderStatus): string {
  const statusClassMap: Record<WorkOrderStatus, string> = {
    PENDING: "border-border-strong bg-surface-muted text-muted-foreground",
    IN_PROGRESS: "border-primary/45 bg-primary/10 text-white",
    READY: "border-warning/45 bg-warning/10 text-warning",
    DELIVERED: "border-success/35 bg-success/10 text-success",
  };

  return statusClassMap[status];
}