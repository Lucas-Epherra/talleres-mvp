import {
  CalendarDays,
  CarFront,
  ClipboardList,
  ReceiptText,
  Search,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

type QuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
  variant?: "primary" | "secondary";
};

const quickActions: QuickAction[] = [
  {
    label: "Nueva orden",
    href: "/vehicles",
    icon: ClipboardList,
    variant: "primary",
  },
  {
    label: "Nuevo cliente",
    href: "/customers/new",
    icon: UserPlus,
  },
  {
    label: "Nuevo vehículo",
    href: "/vehicles/new",
    icon: CarFront,
  },
  {
    label: "Ver órdenes",
    href: "/work-orders",
    icon: ClipboardList,
  },
  {
    label: "Ver agenda",
    href: "/appointments",
    icon: CalendarDays,
  },
  {
    label: "Ver recibos",
    href: "/receipts",
    icon: ReceiptText,
  },
  {
    label: "Buscar vehículo",
    href: "/vehicles",
    icon: Search,
  },
];

/**
 * Dashboard shortcuts for common workshop actions.
 */
export function DashboardQuickActions() {
  return (
    <section
      aria-labelledby="quick-actions-heading"
      className="rounded-[1.35rem] border border-border bg-white/96 p-4 shadow-(--shadow-industrial) ring-1 ring-white/70 sm:p-5"
    >
      <div className="border-b border-border pb-4">
        <p className="text-[0.66rem] font-black uppercase tracking-[0.2em] text-primary">
          Acciones rápidas
        </p>

        <h2
          id="quick-actions-heading"
          className="mt-1.5 font-display text-lg font-black uppercase tracking-[0.035em] text-foreground"
        >
          Atajos del día
        </h2>

        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Lo que más se usa para avanzar sin dar vueltas.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className={getQuickActionClassName(action.variant ?? "secondary")}
            >
              <span className={getQuickActionIconClassName(action.variant ?? "secondary")}>
                <Icon className="size-4" aria-hidden="true" />
              </span>

              <span className="min-w-0 text-sm font-bold leading-5 text-foreground">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function getQuickActionClassName(variant: "primary" | "secondary"): string {
  const baseClassName =
    "flex min-h-13 items-center gap-2 rounded-2xl border px-3 py-2.5 transition duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 hover:-translate-y-0.5 hover:shadow-sm sm:min-h-14 sm:gap-3 sm:px-4 sm:py-3";

  if (variant === "primary") {
    return `${baseClassName} border-primary/35 bg-primary/10 hover:border-primary/60 hover:bg-primary/15`;
  }

  return `${baseClassName} border-border bg-surface-muted/55 hover:border-primary/35 hover:bg-white`;
}

function getQuickActionIconClassName(variant: "primary" | "secondary"): string {
  const baseClassName = "grid size-8 shrink-0 place-items-center rounded-xl border sm:size-9";

  if (variant === "primary") {
    return `${baseClassName} border-primary/30 bg-primary text-white`;
  }

  return `${baseClassName} border-border-strong bg-white text-primary`;
}
