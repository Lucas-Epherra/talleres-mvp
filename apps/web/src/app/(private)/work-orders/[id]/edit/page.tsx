import { ArrowLeft, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ApiError } from "../../../../../lib/api";
import { EditWorkOrderForm } from "../../../../../features/work-orders/components/EditWorkOrderForm";
import { getWorkOrder } from "../../../../../features/work-orders/work-orders.server";
import type { WorkOrder } from "../../../../../features/work-orders/types";

type EditWorkOrderPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type ClosedWorkOrderStatus = Extract<
  WorkOrder["status"],
  "DELIVERED" | "CANCELLED"
>;

type ClosedWorkOrderEditLockCopy = {
  eyebrow: string;
  eyebrowClassName: string;
  iconClassName: string;
  title: string;
  description: string;
  protectionEyebrow: string;
  protectionTitle: string;
  protectionDescription: string;
  primaryActionLabel: string;
};

const CLOSED_WORK_ORDER_EDIT_LOCK_COPY: Record<
  ClosedWorkOrderStatus,
  ClosedWorkOrderEditLockCopy
> = {
  DELIVERED: {
    eyebrow: "Orden entregada",
    eyebrowClassName: "text-success",
    iconClassName: "text-success",
    title: "Edición bloqueada",
    description:
      "La orden ya fue marcada como entregada. Para modificar sus datos, primero debe reabrirse desde el detalle con un motivo obligatorio.",
    protectionEyebrow: "Protección operativa",
    protectionTitle: "No se puede editar una orden entregada",
    protectionDescription:
      "Este bloqueo evita cambios directos sobre órdenes cerradas. Usá la corrección controlada desde el detalle para reabrirla y dejar la trazabilidad correspondiente en el historial operativo.",
    primaryActionLabel: "Ver corrección controlada",
  },
  CANCELLED: {
    eyebrow: "Orden anulada",
    eyebrowClassName: "text-destructive",
    iconClassName: "text-destructive",
    title: "Edición bloqueada",
    description:
      "La orden fue anulada y quedó fuera del flujo operativo. No puede editarse ni reabrirse desde esta pantalla.",
    protectionEyebrow: "Historial protegido",
    protectionTitle: "No se puede editar una orden anulada",
    protectionDescription:
      "Este bloqueo preserva la trazabilidad de una orden cerrada por anulación. Si la anulación fue un error operativo, debe resolverse con una nueva orden o con una acción específica definida desde backend.",
    primaryActionLabel: "Volver al detalle",
  },
};

export const metadata: Metadata = {
  title: "Editar orden",
};

/**
 * Work order edit page.
 *
 * This Server Component fetches the current order using the forwarded httpOnly
 * cookie and delegates interactive mutation logic to EditWorkOrderForm only
 * when the order is still editable.
 */
export default async function EditWorkOrderPage({
  params,
}: EditWorkOrderPageProps) {
  const resolvedParams = await params;
  const workOrder = await getWorkOrderOrNotFound(resolvedParams.id);

  if (isClosedWorkOrderStatus(workOrder.status)) {
    return <ClosedWorkOrderEditLock workOrder={workOrder} />;
  }

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div className="relative max-w-3xl">
          <Link
            href={`/work-orders/${workOrder.id}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-hover"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
            Volver al detalle
          </Link>

          <p className="mt-6 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Orden #{workOrder.orderNumber}
          </p>

          <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
            Editar orden de trabajo
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Actualizá diagnóstico, trabajo realizado, repuestos, kilometraje,
            costos y notas internas. El estado de la orden se gestiona desde el
            detalle para mantener el flujo separado.
          </p>
        </div>
      </header>

      <EditWorkOrderForm workOrder={workOrder} />
    </section>
  );
}

/**
 * Shows a safe read-only lock screen when someone tries to edit a closed order
 * directly from the URL.
 */
function ClosedWorkOrderEditLock({ workOrder }: { workOrder: WorkOrder }) {
  const status = workOrder.status as ClosedWorkOrderStatus;
  const copy = CLOSED_WORK_ORDER_EDIT_LOCK_COPY[status];

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div className="relative max-w-3xl">
          <Link
            href={`/work-orders/${workOrder.id}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-hover"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
            Volver al detalle
          </Link>

          <p
            className={`mt-6 text-[0.68rem] font-bold uppercase tracking-[0.22em] ${copy.eyebrowClassName}`}
          >
            {copy.eyebrow}
          </p>

          <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
            {copy.title}
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            La orden #{workOrder.orderNumber} {copy.description}
          </p>
        </div>
      </header>

      <section
        aria-labelledby="closed-work-order-lock-heading"
        className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3"
      >
        <div className="flex items-start gap-3">
          <div
            className={`grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted ${copy.iconClassName}`}
          >
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p
              className={`text-[0.68rem] font-bold uppercase tracking-[0.22em] ${copy.eyebrowClassName}`}
            >
              {copy.protectionEyebrow}
            </p>

            <h2
              id="closed-work-order-lock-heading"
              className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
            >
              {copy.protectionTitle}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {copy.protectionDescription}
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={`/work-orders/${workOrder.id}`}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover sm:w-auto"
              >
                {copy.primaryActionLabel}
              </Link>

              <Link
                href="/work-orders"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated sm:w-auto"
              >
                Ver todas las órdenes
              </Link>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

/**
 * Returns true when a work order is closed and should not be edited directly.
 */
function isClosedWorkOrderStatus(
  status: WorkOrder["status"],
): status is ClosedWorkOrderStatus {
  return status === "DELIVERED" || status === "CANCELLED";
}

/**
 * Fetches a work order and converts backend 404 responses into Next notFound.
 */
async function getWorkOrderOrNotFound(workOrderId: string): Promise<WorkOrder> {
  try {
    return await getWorkOrder(workOrderId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
