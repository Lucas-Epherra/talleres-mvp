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
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
      <header className="border-b border-border bg-background/95 shadow-[0_16px_50px_rgba(0,0,0,0.25)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <Link
              href="/dashboard"
              className="group flex min-w-0 items-center gap-3"
              aria-label="Ir al dashboard"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-elevated shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <span className="font-display text-base font-black italic tracking-[-0.08em] text-primary">
                  M1
                </span>
              </span>

              <span className="min-w-0">
                <span className="block truncate font-display text-xl font-black italic uppercase tracking-[0.02em] text-white">
                  Mi <span className="text-primary">Taller</span>
                </span>

                <span className="block truncate text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Mecánica confiable
                </span>
              </span>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <div className="hidden rounded-2xl border border-border bg-surface/80 px-4 py-2 text-right sm:block">
              <p className="text-sm font-semibold text-white">{user.name}</p>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {user.role}
              </p>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-5 px-5 py-6 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-6 lg:py-8">
        <aside className="min-w-0 overflow-hidden rounded-[1.35rem] border border-border bg-surface/85 p-3 shadow-[var(--shadow-industrial)] ring-1 ring-white/[0.03] lg:p-4">
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