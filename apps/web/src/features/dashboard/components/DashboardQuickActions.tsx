import {
  CarFront,
  ClipboardList,
  Search,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

type QuickAction = {
  label: string;
  description: string;
  href: string;
  variant: "primary" | "secondary";
  icon: LucideIcon;
};

const quickActions: QuickAction[] = [
  {
    label: "Nuevo cliente",
    description: "Registrar persona o empresa.",
    href: "/customers/new",
    variant: "primary",
    icon: UserPlus,
  },
  {
    label: "Nuevo vehículo",
    description: "Asociar vehículo a cliente.",
    href: "/vehicles/new",
    variant: "secondary",
    icon: CarFront,
  },
  {
    label: "Ver órdenes",
    description: "Revisar flujo de trabajo.",
    href: "/work-orders",
    variant: "secondary",
    icon: ClipboardList,
  },
  {
    label: "Vehículos",
    description: "Buscar fichas técnicas.",
    href: "/vehicles",
    variant: "secondary",
    icon: Search,
  },
];

/**
 * Dashboard shortcuts for the most common operational flows.
 */
export function DashboardQuickActions() {
  return (
    <section
      aria-labelledby="quick-actions-heading"
      className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface-elevated via-surface to-surface p-4 shadow-(--shadow-industrial) ring-1 ring-white/3"
    >
      <div className="border-b border-border pb-4">
        <p className="text-[0.66rem] font-bold uppercase tracking-[0.22em] text-primary">
          Accesos rápidos
        </p>

        <h2
          id="quick-actions-heading"
          className="mt-1.5 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground"
        >
          Operaciones
        </h2>

        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Atajos para avanzar sin recorrer el menú.
        </p>
      </div>

      <div className="mt-4 grid gap-2">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className={getQuickActionClassName(action.variant)}
            >
              <span className={getQuickActionIconClassName(action.variant)}>
                <Icon className="size-4" aria-hidden="true" />
              </span>

              <span className="min-w-0">
                <span className="block font-bold text-foreground">
                  {action.label}
                </span>

                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  {action.description}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Returns visual classes for quick action links.
 */
function getQuickActionClassName(variant: "primary" | "secondary"): string {
  const baseClassName =
    "flex min-h-20 items-start gap-3 rounded-2xl border p-3.5 transition focus:outline-none focus:ring-2 focus:ring-primary/30";

  if (variant === "primary") {
    return `${baseClassName} border-primary/35 bg-primary/10 hover:border-primary/65 hover:bg-primary/15`;
  }

  return `${baseClassName} border-border bg-surface-muted/85 hover:border-primary/45 hover:bg-surface-elevated`;
}

/**
 * Returns visual classes for quick action icon containers.
 */
function getQuickActionIconClassName(variant: "primary" | "secondary"): string {
  const baseClassName =
    "grid size-9 shrink-0 place-items-center rounded-xl border";

  if (variant === "primary") {
    return `${baseClassName} border-primary/30 bg-primary text-white`;
  }

  return `${baseClassName} border-border-strong bg-surface-elevated text-primary`;
}
