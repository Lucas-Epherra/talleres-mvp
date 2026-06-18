/**
 * Main dashboard heading.
 */
export function DashboardHeader() {
  return (
    <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-surface/85 p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
      <div
        aria-hidden="true"
        className="absolute right-0 top-0 h-56 w-56 translate-x-16 -translate-y-20 rounded-full bg-primary/15 blur-3xl"
      />

      <div className="relative">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
          Resumen operativo
        </p>

        <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-white sm:text-3xl">
          Dashboard del taller
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Panel principal para revisar actividad, órdenes activas, vehículos en
          taller y accesos rápidos del flujo operativo.
        </p>
      </div>
    </header>
  );
}