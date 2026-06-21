import { ClipboardPlus, UserPlus } from "lucide-react";
import Link from "next/link";

/**
 * Main dashboard heading.
 */
export function DashboardHeader() {
  return (
    <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-5">
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
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-hover"
          >
            <ClipboardPlus className="size-4 shrink-0" aria-hidden="true" />
            Crear orden
          </Link>

          <Link
            href="/customers/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface"
          >
            <UserPlus className="size-4 shrink-0" aria-hidden="true" />
            Nuevo cliente
          </Link>
        </div>
      </div>
    </header>
  );
}
