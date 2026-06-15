import type { ReactNode } from "react";

type DetailSheetProps = {
  headingId: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  titleSize?: "sm" | "lg";
};

type DetailSheetRowProps = {
  label: string;
  value: ReactNode;
};

/**
 * Reusable spreadsheet-like detail section.
 *
 * Used in detail pages to present complete operational data with a consistent
 * label/value layout.
 */
export function DetailSheet({
  headingId,
  title,
  children,
  action,
  className,
  titleSize = "lg",
}: DetailSheetProps) {
  return (
    <section
      aria-labelledby={headingId}
      className={getContainerClassName(className)}
    >
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Ficha técnica
          </p>

          <h2
            id={headingId}
            className={
              titleSize === "sm"
                ? "font-display text-sm font-black uppercase tracking-[0.04em] text-white"
                : "font-display text-lg font-black uppercase tracking-[0.04em] text-white"
            }
          >
            {title}
          </h2>
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <dl className="divide-y divide-border">{children}</dl>
    </section>
  );
}

/**
 * Single label/value row for DetailSheet.
 */
export function DetailSheetRow({ label, value }: DetailSheetRowProps) {
  return (
    <div className="grid min-w-0 md:grid-cols-[13rem_minmax(0,1fr)]">
      <dt className="min-w-0 border-border bg-background/45 px-4 py-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-steel md:border-r">
        {label}
      </dt>

      <dd className="min-w-0 wrap-break-word px-4 py-3 text-sm font-medium leading-6 text-white">
        {value}
      </dd>
    </div>
  );
}

/**
 * Joins the base sheet class with optional spacing/layout classes.
 */
function getContainerClassName(className?: string): string {
  const baseClassName =
    "overflow-hidden rounded-[1.35rem] border border-border bg-surface/85 shadow-[var(--shadow-industrial)] ring-1 ring-white/[0.03]";

  return className ? `${baseClassName} ${className}` : baseClassName;
}