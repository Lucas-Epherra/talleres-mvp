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
      <div className="flex flex-col gap-3 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
        <h2
          id={headingId}
          className={
            titleSize === "sm"
              ? "text-sm font-semibold text-white"
              : "text-lg font-semibold text-white"
          }
        >
          {title}
        </h2>

        {action ? <div>{action}</div> : null}
      </div>

      <dl className="divide-y divide-slate-800">{children}</dl>
    </section>
  );
}
/**
 * Single label/value row for DetailSheet.
 */
export function DetailSheetRow({ label, value }: DetailSheetRowProps) {
  return (
    <div className="grid min-w-0 md:grid-cols-[12rem_minmax(0,1fr)]">
      <dt className="min-w-0 border-slate-800 bg-slate-950/60 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 md:border-r">
        {label}
      </dt>

      <dd className="min-w-0 px-4 py-3 text-sm font-medium leading-6 text-slate-100 break-words [overflow-wrap:anywhere]">
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
    "rounded-2xl border border-slate-800 bg-slate-950/70";

  return className ? `${baseClassName} ${className}` : baseClassName;
}