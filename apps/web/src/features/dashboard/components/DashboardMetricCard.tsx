import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Circle } from "lucide-react";
import Link from "next/link";

export type DashboardMetricCardProps = {
  label: string;
  value: number | string;
  description: string;
  href?: string;
  linkLabel?: string;
  tone?: "neutral" | "primary" | "warning" | "success" | "danger";
  icon?: LucideIcon;
};

/**
 * Large metric card used inside the dashboard hero.
 *
 * The card keeps one interaction pattern across the dashboard: white surface,
 * subtle border, primary text for links and a restrained hover state.
 */
export function DashboardMetricCard({
  label,
  value,
  description,
  href,
  linkLabel,
  tone = "neutral",
  icon: Icon = Circle,
}: DashboardMetricCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <span className={getIconClassName(tone)}>
          <Icon className="size-4 sm:size-5" aria-hidden="true" />
        </span>

        {href ? (
          <span
            aria-hidden="true"
            className="grid size-6 shrink-0 place-items-center rounded-lg border border-border bg-white/90 text-muted-foreground transition group-hover:border-primary/45 group-hover:text-primary sm:size-7"
          >
            <ArrowUpRight className="size-3 sm:size-3.5" />
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-[0.62rem] font-black uppercase tracking-[0.16em] text-foreground sm:mt-5 sm:text-[0.68rem] sm:tracking-[0.18em]">
        {label}
      </p>

      <p className="mt-1.5 font-display text-3xl font-black leading-none tracking-[-0.04em] text-foreground sm:mt-2 sm:text-4xl">
        {value}
      </p>

      <p className={getDescriptionClassName(tone)}>{description}</p>

      {href ? (
        <div className="mt-4 border-t border-border pt-3 text-center text-xs font-black text-primary transition group-hover:text-primary-hover sm:mt-5 sm:pt-4 sm:text-sm">
          {linkLabel ?? `Ver ${label.toLowerCase()}`}
        </div>
      ) : null}
    </>
  );

  const className = `${getCardClassName(
    tone,
  )} focus:outline-none focus:ring-2 focus:ring-primary/30`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
}

function getCardClassName(tone: DashboardMetricCardProps["tone"]): string {
  const baseClassName =
    "group min-h-36 rounded-2xl border bg-white/96 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.95)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(15,23,42,0.11),inset_0_1px_0_rgba(255,255,255,0.95)] sm:min-h-44 sm:p-5";

  if (tone === "primary") {
    return `${baseClassName} border-primary/25 hover:border-primary/55`;
  }

  if (tone === "warning") {
    return `${baseClassName} border-warning/35 hover:border-warning/60`;
  }

  if (tone === "success") {
    return `${baseClassName} border-success/35 hover:border-success/60`;
  }

  if (tone === "danger") {
    return `${baseClassName} border-primary/25 bg-primary/8 hover:border-primary/55`;
  }

  return `${baseClassName} border-border hover:border-primary/35`;
}

function getIconClassName(tone: DashboardMetricCardProps["tone"]): string {
  const baseClassName =
    "grid size-9 shrink-0 place-items-center rounded-xl border sm:size-11 sm:rounded-2xl";

  if (tone === "primary" || tone === "danger") {
    return `${baseClassName} border-primary/20 bg-primary/10 text-primary`;
  }

  if (tone === "warning") {
    return `${baseClassName} border-warning/25 bg-warning/10 text-warning`;
  }

  if (tone === "success") {
    return `${baseClassName} border-success/25 bg-success/10 text-success`;
  }

  return `${baseClassName} border-border bg-surface-muted text-foreground`;
}

function getDescriptionClassName(tone: DashboardMetricCardProps["tone"]): string {
  const baseClassName = "mt-2 text-[0.68rem] leading-4 sm:mt-3 sm:text-xs sm:leading-5";

  if (tone === "success") {
    return `${baseClassName} font-bold text-success`;
  }

  if (tone === "warning") {
    return `${baseClassName} font-bold text-warning`;
  }

  if (tone === "danger" || tone === "primary") {
    return `${baseClassName} font-bold text-primary`;
  }

  return `${baseClassName} font-semibold text-muted-foreground`;
}
