import Link from "next/link";

/**
 * Private application footer.
 *
 * Adds a subtle closing point to long operational screens without introducing
 * marketing noise into the workshop dashboard.
 */
export function PrivateFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="theme-dark-shell border-t border-border bg-background/95">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-1">
          <p className="font-display text-sm font-black italic uppercase tracking-[0.08em] text-white">
            Mi <span className="text-primary">Taller</span>
          </p>

          <p>Mecánica confiable. Resultados que duran.</p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <p>© {currentYear} · MVP operativo en desarrollo</p>

          <Link
            href="/dashboard"
            className="font-bold text-primary transition hover:text-primary-hover"
          >
            Volver al panel
          </Link>
        </div>
      </div>
    </footer>
  );
}
