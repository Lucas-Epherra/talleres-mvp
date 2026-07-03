import {
  Ban,
  CheckCircle2,
  ClipboardList,
  TimerReset,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { DashboardSummary, WorkOrderStatus } from "../types";

type DashboardWorkflowPanelProps = {
  summary: DashboardSummary;
};

const workflowIcons: Record<WorkOrderStatus, LucideIcon> = {
  PENDING: TimerReset,
  IN_PROGRESS: Wrench,
  READY: CheckCircle2,
  DELIVERED: ClipboardList,
  CANCELLED: Ban,
};

/**
 * Shows the current order workflow as a clear workshop status strip.
 */
export function DashboardWorkflowPanel({ summary }: DashboardWorkflowPanelProps) {
  return (
    <section
      aria-labelledby="workflow-heading"
      className="rounded-[1.35rem] border border-border bg-white/96 p-4 shadow-(--shadow-industrial) ring-1 ring-white/70 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.66rem] font-black uppercase tracking-[0.2em] text-primary">
            Órdenes del taller
          </p>

          <h2
            id="workflow-heading"
            className="mt-1.5 font-display text-lg font-black uppercase tracking-[0.035em] text-foreground"
          >
            Cómo están tus órdenes
          </h2>

          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Vista rápida de pendientes, trabajos en curso y entregas.
          </p>
        </div>

        <Link
          href="/work-orders"
          className="text-xs font-black uppercase tracking-[0.14em] text-primary transition hover:text-primary-hover"
        >
          Ver todas
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {summary.workflow.map((item, index) => (
          <WorkflowStep
            key={item.status}
            item={item}
            isLast={index === summary.workflow.length - 1}
          />
        ))}
      </div>
    </section>
  );
}

function WorkflowStep({
  item,
  isLast,
}: {
  item: DashboardSummary["workflow"][number];
  isLast: boolean;
}) {
  const Icon = workflowIcons[item.status];
  const toneClasses = getWorkflowToneClasses(item.status);

  return (
    <Link
      href={`/work-orders?status=${item.status}`}
      className="group relative rounded-2xl border border-border bg-surface-muted/45 p-3 text-center transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-white hover:shadow-sm sm:p-4"
    >
      {!isLast ? (
        <span
          aria-hidden="true"
          className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-muted-foreground lg:block"
        >
          →
        </span>
      ) : null}

      <span className={`${toneClasses.icon} mx-auto grid size-10 place-items-center rounded-2xl border sm:size-12`}>
        <Icon className="size-4 sm:size-5" aria-hidden="true" />
      </span>

      <p className="mt-3 text-[0.62rem] font-black uppercase tracking-[0.12em] text-foreground sm:text-[0.68rem] sm:tracking-[0.14em]">
        {item.label}
      </p>

      <p className="mt-2 font-display text-3xl font-black leading-none text-foreground">
        {item.count}
      </p>

      <p className={`${toneClasses.text} mt-2 text-xs font-bold`}>
        Ver órdenes
      </p>
    </Link>
  );
}

function getWorkflowToneClasses(status: WorkOrderStatus): {
  icon: string;
  text: string;
} {
  const map: Record<WorkOrderStatus, { icon: string; text: string }> = {
    PENDING: {
      icon: "border-primary/20 bg-primary/8 text-primary",
      text: "text-primary",
    },
    IN_PROGRESS: {
      icon: "border-warning/25 bg-warning/10 text-warning",
      text: "text-warning",
    },
    READY: {
      icon: "border-success/25 bg-success/10 text-success",
      text: "text-success",
    },
    DELIVERED: {
      icon: "border-success/25 bg-success/10 text-success",
      text: "text-success",
    },
    CANCELLED: {
      icon: "border-border-strong bg-surface-muted text-muted-foreground",
      text: "text-muted-foreground",
    },
  };

  return map[status];
}
