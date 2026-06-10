import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "../../features/auth/auth.server";
import { LogoutButton } from "../../features/auth/components/LogoutButton";

/**
 * Private application layout.
 *
 * Blocks unauthenticated access and exposes the authenticated user context
 * at layout level.
 */
export default async function PrivateLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/95">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className="text-lg font-semibold tracking-tight text-white"
            >
              Talleres MVP
            </Link>
            <p className="text-xs text-slate-400">
              Panel operativo del taller
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-100">{user.name}</p>
              <p className="text-xs text-slate-400">{user.role}</p>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <nav aria-label="Navegación principal">
            <ul className="space-y-1">
              <li>
                <Link
                  href="/dashboard"
                  className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 hover:text-white"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/customers"
                  className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 hover:text-white"
                >
                  Clientes
                </Link>
              </li>
              <li>
                <Link
                  href="/vehicles"
                  className="block rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white"
                >
                  Vehículos
                </Link>
              </li>
              <li>
                <Link
                  href="/work-orders"
                  className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 hover:text-white"
                >
                  Órdenes
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}