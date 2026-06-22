import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "../../features/auth/components/LoginForm";
import { getCurrentUser } from "../../features/auth/auth.server";

export const metadata: Metadata = {
  title: "Login",
};

/**
 * Public login page.
 *
 * Authenticated users are redirected to the private dashboard. The login form
 * keeps authentication logic isolated in a leaf Client Component.
 */
export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="theme-dark-shell relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-10 text-foreground sm:px-6 sm:py-12">
      <div
        aria-hidden="true"
        className="absolute left-0 top-0 h-80 w-80 -translate-x-24 -translate-y-24 rounded-full bg-primary/12 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0 h-96 w-96 translate-x-28 translate-y-28 rounded-full bg-surface-elevated/55 blur-3xl"
      />

      <section className="relative w-full max-w-md overflow-hidden rounded-[1.35rem] border border-border bg-surface/88 p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div className="relative mb-8 space-y-5">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-elevated shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <span className="font-display text-sm font-black italic tracking-[-0.08em] text-primary">
                M1
              </span>
            </span>

            <div className="min-w-0">
              <p className="font-display text-xl font-black italic uppercase tracking-[0.02em] text-foreground">
                Mi <span className="text-primary">Taller</span>
              </p>

              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Mecánica confiable
              </p>
            </div>
          </div>

          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              Acceso privado
            </p>

            <h1 className="mt-3 font-display text-3xl font-black uppercase tracking-[0.04em] text-foreground">
              Iniciar sesión
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Accedé al panel operativo para gestionar clientes, vehículos,
              órdenes de trabajo e historial del taller.
            </p>
          </div>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}
