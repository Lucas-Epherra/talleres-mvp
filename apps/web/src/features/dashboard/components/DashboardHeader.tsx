import Link from "next/link";

/**
 * Main dashboard heading.
 */
export function DashboardHeader() {
  return (
    <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-5">
      <div
        aria-hidden="true"
        className="absolute right-0 top-0 h-36 w-36 translate-x-12 -translate-y-14 rounded-full bg-primary/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-24 w-48 -translate-x-16 translate-y-12 rounded-full bg-carbon/10 blur-3xl"
      />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Resumen operativo
          </p>

          <h1 className="mt-2 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
            Dashboard del taller
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Vista compacta para revisar actividad, órdenes activas, vehículos en
            taller y accesos rápidos del flujo operativo.
          </p>
        </div>

        <div className="grid gap-2 sm:flex sm:shrink-0 sm:flex-wrap sm:justify-end">
          <Link
            href="/vehicles"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-[0_14px_35px_rgba(214,40,40,0.22)] transition hover:bg-primary-hover"
          >
            Crear orden
          </Link>

          <Link
            href="/customers/new"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface"
          >
            Nuevo cliente
          </Link>
        </div>
      </div>
    </header>
  );
}
