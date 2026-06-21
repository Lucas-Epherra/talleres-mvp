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
 * Blocks unauthenticated access and exposes the authenticated user context at
 * layout level. The shell keeps the industrial dark identity while the main
 * workspace uses the lighter operational theme.
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
    <div className="theme-light flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
      <header className="theme-dark-shell border-b border-border bg-background/95 shadow-[0_16px_50px_rgba(0,0,0,0.25)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <Link
              href="/dashboard"
              className="group flex min-w-0 items-center gap-2 sm:gap-3"
              aria-label="Ir al dashboard"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-border-strong bg-surface-elevated shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:size-11 sm:rounded-2xl">
                <span className="font-display text-xs font-black italic tracking-[-0.08em] text-primary sm:text-base">
                  M1
                </span>
              </span>

              <span className="min-w-0">
                <span className="block max-w-28 truncate font-display text-sm font-black italic uppercase tracking-[0.02em] text-white xs:max-w-36 sm:max-w-none sm:text-xl">
                  Mi <span className="text-primary">Taller</span>
                </span>

                <span className="hidden truncate text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground sm:block">
                  Mecánica confiable
                </span>
              </span>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
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

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-4 px-3 py-4 sm:gap-5 sm:px-6 sm:py-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-6 lg:py-8">
        <aside className="min-w-0 self-start overflow-hidden rounded-[1.1rem] border border-[#cbd1d8] bg-linear-to-b from-[#eef1f4] via-[#dde2e8] to-[#cfd6df] p-2.5 shadow-(--shadow-industrial) ring-1 ring-black/5 sm:rounded-[1.35rem] sm:p-3 lg:sticky lg:top-8 lg:p-4">
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