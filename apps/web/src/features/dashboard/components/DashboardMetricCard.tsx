import Link from "next/link";

type DashboardMetricCardProps = {
  label: string;
  value: number;
  description: string;
  href?: string;
  tone?: "neutral" | "primary" | "warning" | "success";
};

/**
 * Small reusable metric card for dashboard summary values.
 *
 * When href is provided, the card becomes a navigable dashboard shortcut while
 * keeping a metric-card visual language.
 */
export function DashboardMetricCard({
  label,
  value,
  description,
  href,
  tone = "neutral",
}: DashboardMetricCardProps) {
  const content = (
    <>
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-3 font-display text-3xl font-black text-white">
        {value}
      </p>

      <p className="mt-2 text-sm leading-5 text-muted-foreground">
        {description}
      </p>

      {href ? (
        <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-primary">
          Abrir
        </p>
      ) : null}
    </>
  );

  const className = `${getMetricCardClassName(
    tone,
  )} focus:outline-none focus:ring-2 focus:ring-primary/30`;

  if (href) {
    return (
      <Link
        href={href}
        aria-label={`Abrir ${label.toLowerCase()}`}
        className={className}
      >
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
}

/**
 * Maps dashboard metric tones to branded card classes.
 */
function getMetricCardClassName(tone: DashboardMetricCardProps["tone"]): string {
  const baseClassName =
    "group rounded-2xl border p-5 shadow-[var(--shadow-industrial)] ring-1 ring-white/[0.03] transition";

  if (tone === "primary") {
    return `${baseClassName} border-primary/35 bg-primary/10 hover:border-primary/60`;
  }

  if (tone === "warning") {
    return `${baseClassName} border-warning/35 bg-warning/10 hover:border-warning/60`;
  }

  if (tone === "success") {
    return `${baseClassName} border-success/35 bg-success/10 hover:border-success/60`;
  }

  return `${baseClassName} border-border bg-surface/85 hover:border-primary/40 hover:bg-surface-elevated`;
}