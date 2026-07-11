import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ApiError } from "../../../../../lib/api";
import { EditWorkOrderForm } from "../../../../../features/work-orders/components/EditWorkOrderForm";
import {
  getWorkOrder,
  getWorkOrderSupplierCatalog,
} from "../../../../../features/work-orders/work-orders.service";
import type { WorkOrder } from "../../../../../features/work-orders/types";

export const metadata: Metadata = {
  title: "Editar orden",
};

type EditWorkOrderPageProps = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * Edits the operational content and structured supplier parts of a work order.
 */
export default async function EditWorkOrderPage({
  params,
}: EditWorkOrderPageProps) {
  const { id } = await params;
  const [workOrder, supplierCatalog] = await Promise.all([
    getWorkOrderOrNotFound(id),
    getWorkOrderSupplierCatalog(),
  ]);

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <Link
          href={`/work-orders/${workOrder.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-hover"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
          Volver a la orden
        </Link>

        <p className="mt-6 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
          Orden #{workOrder.orderNumber}
        </p>

        <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
          Editar orden de trabajo
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Corregí datos operativos, costos y repuestos estructurados. Los cambios
          en repuestos reemplazan las líneas anteriores para mantener la deuda
          de proveedores consistente.
        </p>
      </header>

      <EditWorkOrderForm
        workOrder={workOrder}
        supplierCatalog={supplierCatalog}
      />
    </section>
  );
}

/**
 * Resolves the work order and maps backend 404 responses to notFound().
 */
async function getWorkOrderOrNotFound(id: string): Promise<WorkOrder> {
  try {
    return await getWorkOrder(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
