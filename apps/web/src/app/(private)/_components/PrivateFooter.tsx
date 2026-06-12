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
    <footer className="border-t border-slate-800 bg-slate-950/95">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-1">
          <p className="font-semibold text-slate-300">Talleres MVP</p>
          <p>Panel operativo para gestión de clientes, vehículos y órdenes.</p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <p>© {currentYear} · MVP en desarrollo</p>

          <Link
            href="/dashboard"
            className="font-semibold text-orange-400 transition hover:text-orange-300"
          >
            Volver al panel
          </Link>
        </div>
      </div>
    </footer>
  );
}