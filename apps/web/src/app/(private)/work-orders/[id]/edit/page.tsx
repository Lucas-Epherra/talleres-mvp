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

export const metadata: Metadata = {
  title: "Editar orden",
};

/**
 * Work order edit page.
 *
 * This Server Component fetches the current order using the forwarded httpOnly
 * cookie and delegates interactive mutation logic to EditWorkOrderForm.
 */
export default async function EditWorkOrderPage({
  params,
}: EditWorkOrderPageProps) {
  const resolvedParams = await params;
  const workOrder = await getWorkOrderOrNotFound(resolvedParams.id);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
        <div className="max-w-3xl">
          <Link
            href={`/work-orders/${workOrder.id}`}
            className="text-sm font-medium text-orange-300 transition hover:text-orange-200"
          >
            ← Volver al detalle
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">
            Orden #{workOrder.orderNumber}
          </p>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Editar orden de trabajo
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
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