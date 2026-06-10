import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "../../features/auth/components/LoginForm";
import { getCurrentUser } from "../../features/auth/auth.server";

export const metadata: Metadata = {
  title: "Login",
};

/**
 * Public login page.
 */
export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-black/30">
        <div className="mb-8 space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">
            Talleres MVP
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Iniciar sesión
          </h1>
          <p className="text-sm leading-6 text-slate-400">
            Accedé al panel operativo para gestionar clientes, vehículos,
            órdenes de trabajo e historial del taller.
          </p>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}