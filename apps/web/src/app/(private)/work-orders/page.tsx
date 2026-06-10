import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Órdenes de trabajo",
};

/**
 * Work orders placeholder page.
 *
 * This route exists to support private navigation before implementing the real
 * work orders list.
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
        Próximo bloque: listado real de órdenes con búsqueda, estado y acceso a
        la ficha del vehículo.
      </p>
    </section>
  );
}