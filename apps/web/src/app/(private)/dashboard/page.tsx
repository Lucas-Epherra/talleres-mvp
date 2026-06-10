import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../features/auth/auth.server";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * Initial private dashboard page.
 *
 * This screen validates the authenticated frontend flow before adding real
 * dashboard widgets.
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">
          Sesión activa
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Dashboard operativo
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          La autenticación frontend ya está conectada con la API. El próximo
          paso será consumir el resumen real de órdenes, vehículos y clientes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Usuario</p>
          <p className="mt-2 text-lg font-semibold text-white">{user.name}</p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Rol</p>
          <p className="mt-2 text-lg font-semibold text-white">{user.role}</p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Workshop ID</p>
          <p className="mt-2 break-all text-sm font-medium text-white">
            {user.workshopId}
          </p>
        </article>
      </div>
    </section>
  );
}