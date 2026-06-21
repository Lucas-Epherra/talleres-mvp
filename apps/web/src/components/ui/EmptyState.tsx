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
    <section className="relative overflow-hidden rounded-[1.35rem] border border-dashed border-border-strong bg-surface/75 p-6 shadow-[var(--shadow-industrial)] ring-1 ring-white/[0.03] sm:p-8">
      <div
        aria-hidden="true"
        className="absolute right-0 top-0 h-28 w-28 translate-x-10 -translate-y-10 rounded-full bg-primary/15 blur-2xl"
      />

      <div className="relative">
        <div className="mb-5 grid size-12 place-items-center rounded-2xl border border-border-strong bg-surface-elevated shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <span className="font-display text-sm font-black italic tracking-[-0.08em] text-primary">
            M1
          </span>
        </div>

        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            {eyebrow}
          </p>
        ) : null}

        <h2
          className={
            eyebrow
              ? "mt-3 font-display text-xl font-black uppercase tracking-[0.02em] text-white"
              : "font-display text-xl font-black uppercase tracking-[0.02em] text-white"
          }
        >
          {title}
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
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
    </section>
  );
}

/**
 * Returns the visual class list for an empty state action.
 */
function getActionClassName(variant: EmptyStateAction["variant"]): string {
  if (variant === "primary") {
    return "inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover";
  }

  return "inline-flex h-11 items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated";
}
