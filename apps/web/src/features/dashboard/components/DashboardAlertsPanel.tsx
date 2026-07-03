import { ChevronRight, ListChecks, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "../../../components/ui/EmptyState";
import { formatRelativeTime } from "../utils";
import type { DashboardAlert } from "../types";

type DashboardAlertsPanelProps = {
  alerts: DashboardAlert[];
};

/**
 * Priority alert panel for the daily workshop routine.
 */
export function DashboardAlertsPanel({ alerts }: DashboardAlertsPanelProps) {
  const visibleAlerts = alerts.slice(0, 4);

  return (
    <section
      aria-labelledby="dashboard-alerts-heading"
      className="overflow-hidden rounded-[1.35rem] border border-border bg-white/96 shadow-(--shadow-industrial) ring-1 ring-white/70"
    >
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-white shadow-[0_10px_25px_rgba(220,38,38,0.2)] sm:size-11">
            <TriangleAlert className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p className="text-[0.66rem] font-black uppercase tracking-[0.2em] text-primary">
              Para revisar
            </p>

            <h2
              id="dashboard-alerts-heading"
              className="mt-1.5 font-display text-lg font-black uppercase tracking-[0.035em] text-foreground"
            >
              Alertas del taller
            </h2>

            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Pendientes que conviene atender antes de seguir con el día.
            </p>
          </div>
        </div>

        <Link
          href="/work-orders"
          className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-xl px-3 text-xs font-black uppercase tracking-[0.12em] text-primary transition hover:bg-primary/8"
        >
          Ver órdenes
          <ListChecks className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      {visibleAlerts.length > 0 ? (
        <div className="grid gap-2.5 p-4 sm:p-5">
          {visibleAlerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}

          {alerts.length > visibleAlerts.length ? (
            <Link
              href="/work-orders"
              className="w-fit text-sm font-bold text-primary transition hover:text-primary-hover"
            >
              + {alerts.length - visibleAlerts.length} alerta
              {alerts.length - visibleAlerts.length === 1 ? "" : "s"} más
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="p-5">
          <EmptyState
            eyebrow="Todo al día"
            title="No hay alertas del taller"
            description="Cuando haya órdenes listas, trabajos demorados o turnos vencidos, los vas a ver acá."
            actions={[
              {
                label: "Ver órdenes",
                href: "/work-orders",
                variant: "primary",
              },
            ]}
          />
        </div>
      )}
    </section>
  );
}

function AlertRow({ alert }: { alert: DashboardAlert }) {
  const toneClasses = getAlertToneClasses(alert.severity);

  return (
    <Link
      href={alert.href}
      className="group grid gap-2 rounded-2xl border border-border bg-surface-muted/48 px-3.5 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white hover:shadow-sm sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:items-center sm:gap-3 sm:px-4 sm:py-3.5"
    >
      <span
        aria-hidden="true"
        className={`${toneClasses.dot} size-2.5 rounded-full`}
      />

      <span className="min-w-0">
        <span className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="line-clamp-1 text-sm font-black text-foreground">
            {alert.title}
          </span>

          <span className={toneClasses.badge}>{getSeverityLabel(alert.severity)}</span>
        </span>

        <span className="mt-1 line-clamp-1 text-sm text-muted-foreground">
          {alert.description}
        </span>
      </span>

      <span className="text-xs font-semibold text-muted-foreground">
        {formatRelativeTime(alert.createdAt)}
      </span>

      <ChevronRight
        className="hidden size-4 text-muted-foreground transition group-hover:text-primary sm:block"
        aria-hidden="true"
      />
    </Link>
  );
}

function getSeverityLabel(severity: DashboardAlert["severity"]): string {
  const labels: Record<DashboardAlert["severity"], string> = {
    success: "Listo",
    warning: "Revisar",
    danger: "Prioridad",
  };

  return labels[severity];
}

function getAlertToneClasses(severity: DashboardAlert["severity"]): {
  dot: string;
  badge: string;
} {
  if (severity === "success") {
    return {
      dot: "bg-success",
      badge:
        "w-fit rounded-lg bg-success/12 px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-success",
    };
  }

  if (severity === "warning") {
    return {
      dot: "bg-warning",
      badge:
        "w-fit rounded-lg bg-warning/12 px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-warning",
    };
  }

  return {
    dot: "bg-primary",
    badge:
      "w-fit rounded-lg bg-primary/10 px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-primary",
  };
}
