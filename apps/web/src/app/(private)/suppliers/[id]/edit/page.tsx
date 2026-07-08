import { ArrowLeft, Handshake } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditSupplierForm } from "../../../../../features/suppliers/components/EditSupplierForm";
import { getSupplier } from "../../../../../features/suppliers/suppliers.server";
import type { Supplier } from "../../../../../features/suppliers/types";
import { ApiError } from "../../../../../lib/api";

type EditSupplierPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Editar proveedor",
};

/**
 * Supplier edit page.
 */
export default async function EditSupplierPage({ params }: EditSupplierPageProps) {
  const { id } = await params;
  const supplier = await resolveSupplier(id);

  return (
    <section className="space-y-6 sm:space-y-8">
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div className="min-w-0">
          <Link
            href={`/suppliers/${supplier.id}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-hover"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
            Volver a la ficha
          </Link>

          <p className="mt-6 flex w-fit items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            <Handshake className="size-4 shrink-0" aria-hidden="true" />
            Editar proveedor
          </p>

          <h1 className="mt-3 wrap-anywhere font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
            {supplier.name}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Actualizá datos de contacto y categorías sin modificar historial,
            compras, pagos ni métricas ya calculadas.
          </p>
        </div>
      </header>

      <EditSupplierForm supplier={supplier} />
    </section>
  );
}

async function resolveSupplier(id: string): Promise<Supplier> {
  try {
    return await getSupplier(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
