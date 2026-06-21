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
 * Keeps the dark top shell and renders the private navigation as a compact
 * horizontal bar below the header. This maximizes workspace width while keeping
 * the industrial brand identity.
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
      <header className="theme-dark-shell border-b border-white/10 bg-background">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-3 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <Link
              href="/dashboard"
              className="group flex min-w-0 items-center gap-2 sm:gap-3"
              aria-label="Ir al dashboard"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/5 sm:size-11">
                <span className="font-display text-sm font-black italic tracking-[-0.08em] text-primary sm:text-base">
                  M1
                </span>
              </span>

              <span className="min-w-0">
                <span className="block max-w-32 truncate font-display text-lg font-black italic uppercase tracking-[0.02em] text-white xs:max-w-40 sm:max-w-none sm:text-2xl">
                  Mi <span className="text-primary">Taller</span>
                </span>

                <span className="hidden truncate text-xs font-medium uppercase tracking-[0.18em] text-white/70 sm:block">
                  Mecánica confiable
                </span>
              </span>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="hidden rounded-2xl border border-white/15 bg-white/3 px-4 py-2 text-right sm:block">
              <p className="text-sm font-semibold text-white">{user.name}</p>

              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/65">
                {user.role}
              </p>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="border-b border-[#d8dde5] bg-background">
        <div className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-6">
          <PrivateNavigation />
        </div>
      </div>

      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:py-7"
      >
        {children}
      </main>

      <PrivateFooter />
    </div>
  );
}
