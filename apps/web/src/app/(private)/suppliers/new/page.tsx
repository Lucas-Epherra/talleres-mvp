import { ArrowLeft, Handshake } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CreateSupplierForm } from "../../../../features/suppliers/components/CreateSupplierForm";

export const metadata: Metadata = {
  title: "Nuevo proveedor",
};

/**
 * Supplier creation page.
 */
export default function NewSupplierPage() {
  return (
    <section className="space-y-6 sm:space-y-8">
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div className="min-w-0">
          <Link
            href="/suppliers"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-hover"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
            Volver a proveedores
          </Link>

          <p className="mt-6 inline-flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            <Handshake className="size-4 shrink-0" aria-hidden="true" />
            Nuevo proveedor
          </p>

          <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
            Cargar proveedor
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Creá una ficha para poder vincular categorías, repuestos, pagos y
            compras por orden en las siguientes fases del módulo.
          </p>
        </div>
      </header>

      <CreateSupplierForm />
    </section>
  );
}
