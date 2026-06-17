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
 * On mobile it behaves as stacked label/value cards. From md upwards it keeps
 * the spreadsheet-style label/value layout used across detail pages.
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
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Ficha técnica
          </p>

          <h2
            id={headingId}
            className={
              titleSize === "sm"
                ? "font-display text-base font-black uppercase tracking-[0.04em] text-white sm:text-sm"
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
      <dt className="min-w-0 bg-background/35 px-4 pb-1 pt-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-steel md:border-r md:border-border md:bg-background/45 md:py-3">
        {label}
      </dt>

      <dd className="min-w-0 wrap-anywhere bg-background/20 px-4 pb-4 pt-1 text-sm font-semibold leading-6 text-white md:bg-transparent md:py-3 md:font-medium">
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
    "overflow-hidden rounded-[1.1rem] border border-border bg-surface/85 shadow-[var(--shadow-industrial)] ring-1 ring-white/[0.03] sm:rounded-[1.35rem]";

  return className ? `${baseClassName} ${className}` : baseClassName;
}