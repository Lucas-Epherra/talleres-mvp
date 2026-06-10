import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Órdenes de trabajo",
};

/**
 * Work orders placeholder page.
 *
 * The real list will be implemented after the vehicle-first creation flow.
 */
export default function WorkOrdersPage() {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">
        Órdenes
      </p>

      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
        Órdenes de trabajo
      </h1>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
        El listado real de órdenes queda para el próximo bloque. Por ahora, el
        flujo correcto del MVP es crear una orden desde la ficha de un vehículo.
      </p>

      <Link
        href="/vehicles"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-400"
      >
        Ir a vehículos
      </Link>
    </section>
  );
}