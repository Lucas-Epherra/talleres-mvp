import Link from "next/link";

type EmptyStateAction = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

type EmptyStateProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
};

/**
 * Reusable empty state for private operational pages.
 *
 * It provides a consistent way to explain missing data or empty filtered
 * results while guiding the user toward the next useful action.
 */
export function EmptyState({
  eyebrow,
  title,
  description,
  actions = [],
}: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 p-6 sm:p-8">
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">
          {eyebrow}
        </p>
      ) : null}

      <h2 className={eyebrow ? "mt-3 text-lg font-semibold text-white" : "text-lg font-semibold text-white"}>
        {title}
      </h2>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
        {description}
      </p>

      {actions.length > 0 ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {actions.map((action) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className={getActionClassName(action.variant ?? "secondary")}
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Returns the visual class list for an empty state action.
 */
function getActionClassName(variant: EmptyStateAction["variant"]): string {
  if (variant === "primary") {
    return "inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-400";
  }

  return "inline-flex h-11 items-center justify-center rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900";
}