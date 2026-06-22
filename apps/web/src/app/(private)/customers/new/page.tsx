import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CreateCustomerForm } from "../../../../features/customers/components/CreateCustomerForm";

export const metadata: Metadata = {
  title: "Nuevo cliente",
};

/**
 * Customer creation page.
 */
export default function NewCustomerPage() {
  return (
    <section className="space-y-8">
      <header className="rounded-[1.35rem] border border-border bg-surface/85 p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-hover"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
          Volver a clientes
        </Link>

        <p className="mt-6 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
          Nuevo cliente
        </p>

        <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
          Crear cliente
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Cargá los datos básicos del cliente. Después vas a poder asociarle uno
          o más vehículos.
        </p>
      </header>

      <CreateCustomerForm />
    </section>
  );
}
