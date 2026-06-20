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
 * keeping a compact cockpit visual language.
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
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>

        {href ? (
          <span
            aria-hidden="true"
            className="grid size-6 shrink-0 place-items-center rounded-lg border border-border bg-surface-elevated text-[0.62rem] font-black text-primary transition group-hover:border-primary/50"
          >
            →
          </span>
        ) : null}
      </div>

      <p className="mt-2 font-display text-3xl font-black leading-none text-foreground">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
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
function getMetricCardClassName(
  tone: DashboardMetricCardProps["tone"],
): string {
  const baseClassName =
    "group min-h-32 rounded-2xl border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition";

  if (tone === "primary") {
    return `${baseClassName} border-primary/30 bg-primary/10 hover:border-primary/55`;
  }

  if (tone === "warning") {
    return `${baseClassName} border-warning/35 bg-warning/10 hover:border-warning/60`;
  }

  if (tone === "success") {
    return `${baseClassName} border-success/35 bg-success/10 hover:border-success/60`;
  }

  return `${baseClassName} border-border bg-surface-muted/85 hover:border-primary/40 hover:bg-surface-elevated`;
}
