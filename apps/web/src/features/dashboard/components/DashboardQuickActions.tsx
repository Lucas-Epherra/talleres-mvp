import Link from "next/link";

const quickActions = [
  {
    label: "Nuevo cliente",
    description: "Registrar una persona o empresa.",
    href: "/customers/new",
    variant: "primary",
  },
  {
    label: "Nuevo vehículo",
    description: "Asociar un vehículo a un cliente.",
    href: "/vehicles/new",
    variant: "secondary",
  },
  {
    label: "Ver órdenes",
    description: "Revisar el flujo de trabajo.",
    href: "/work-orders",
    variant: "secondary",
  },
  {
    label: "Vehículos",
    description: "Buscar fichas técnicas.",
    href: "/vehicles",
    variant: "secondary",
  },
] as const;

/**
 * Dashboard shortcuts for the most common operational flows.
 */
export function DashboardQuickActions() {
  return (
    <section
      aria-labelledby="quick-actions-heading"
      className="rounded-[1.35rem] border border-border bg-surface/85 p-5 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-6"
    >
      <div className="border-b border-border pb-5">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
          Accesos rápidos
        </p>

        <h2
          id="quick-actions-heading"
          className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-white"
        >
          Operaciones frecuentes
        </h2>

        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Atajos para cargar datos y continuar el trabajo sin recorrer el menú.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={getQuickActionClassName(action.variant)}
          >
            <span className="font-bold text-white">{action.label}</span>
            <span className="mt-2 text-sm leading-5 text-muted-foreground">
              {action.description}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * Returns visual classes for quick action links.
 */
function getQuickActionClassName(variant: "primary" | "secondary"): string {
  const baseClassName =
    "flex min-h-28 flex-col justify-between rounded-2xl border p-4 transition focus:outline-none focus:ring-2 focus:ring-primary/30";

  if (variant === "primary") {
    return `${baseClassName} border-primary/45 bg-primary/10 hover:border-primary/70`;
  }

  return `${baseClassName} border-border bg-background/55 hover:border-primary/45 hover:bg-surface-elevated`;
}