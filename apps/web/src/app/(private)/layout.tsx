import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "../../features/auth/auth.server";
import { LogoutButton } from "../../features/auth/components/LogoutButton";
import { PrivateFooter } from "./_components/PrivateFooter";
import { PrivateNavigation } from "./_components/PrivateNavigation";

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
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/95">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div className="min-w-0 space-y-1">
            <Link
              href="/dashboard"
              className="block truncate text-lg font-semibold tracking-tight text-white"
            >
              Talleres MVP
            </Link>

            <p className="text-xs text-slate-400">
              Panel operativo del taller
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-100">{user.name}</p>
              <p className="text-xs text-slate-400">{user.role}</p>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-5 px-5 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6 lg:py-8">
        <aside className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-3 lg:p-4">
          <PrivateNavigation />
        </aside>

        <main id="main-content" className="min-w-0 overflow-hidden">
          {children}
        </main>
      </div>

      <PrivateFooter />
    </div>
  );
}