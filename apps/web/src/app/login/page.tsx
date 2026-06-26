import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LoginForm } from "../../features/auth/components/LoginForm";
import { getCurrentUser } from "../../features/auth/auth.server";

export const metadata: Metadata = {
  title: "Login",
};

/**
 * Public login page.
 *
 * Authenticated users are redirected to the correct area depending on whether
 * they are platform owners or workshop users.
 */
export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(user.platformRole === "OWNER" ? "/platform" : "/dashboard");
  }

  return (
    <main className="theme-dark-shell relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080A0D] px-5 py-10 text-foreground sm:px-6 sm:py-12">
      <div
        aria-hidden="true"
        className="absolute left-0 top-0 h-80 w-80 -translate-x-24 -translate-y-24 rounded-full bg-primary/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0 h-96 w-96 translate-x-28 translate-y-28 rounded-full bg-surface-elevated/35 blur-3xl"
      />

      <section className="relative w-full max-w-md overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#101317]/95 p-6 shadow-(--shadow-industrial) ring-1 ring-white/5 sm:max-w-lg sm:p-8">
        <div className="relative mb-8 space-y-8">
          <div className="flex justify-center">
            <BrandLogo
              variant="dark"
              priority
             className="block h-auto w-[320px] object-contain sm:w-[350px]"
            />
          </div>

          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              Acceso privado
            </p>

            <h1 className="mt-3 font-display text-3xl font-black uppercase tracking-[0.04em] text-foreground sm:text-4xl">
              Iniciar sesión
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Accedé al panel operativo para gestionar clientes, vehículos,
              órdenes de trabajo, agenda y recibos del taller.
            </p>
          </div>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}