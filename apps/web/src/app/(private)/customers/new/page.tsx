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
      <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
        <Link
          href="/customers"
          className="text-sm font-medium text-orange-300 transition hover:text-orange-200"
        >
          ← Volver a clientes
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">
          Nuevo cliente
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Crear cliente
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Cargá los datos básicos del cliente. Después vas a poder asociarle uno
          o más vehículos.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
        <CreateCustomerForm />
      </section>
    </section>
  );
}