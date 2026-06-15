import Link from "next/link";

type SearchFormProps = {
  id: string;
  label: string;
  defaultValue: string;
  placeholder: string;
  clearHref: string;
  showClearAction: boolean;
  submitLabel?: string;
  clearLabel?: string;
};

/**
 * Reusable server-rendered search form for private list pages.
 *
 * Keeps search inputs visually consistent across operational screens and avoids
 * duplicating form markup in customers, vehicles and future list pages.
 */
export function SearchForm({
  id,
  label,
  defaultValue,
  placeholder,
  clearHref,
  showClearAction,
  submitLabel = "Buscar",
  clearLabel = "Limpiar",
}: SearchFormProps) {
  return (
    <form
      className="mt-6 rounded-[1.35rem] border border-border bg-surface/80 p-4 shadow-(--shadow-industrial) ring-1 ring-white/3"
      role="search"
    >
      <label
        htmlFor={id}
        className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-muted-foreground"
      >
        {label}
      </label>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          id={id}
          name="search"
          type="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="h-12 min-h-12 w-full min-w-0 flex-1 appearance-none rounded-xl border border-border-strong bg-background/70 px-4 py-3 text-sm leading-5 text-white outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
        />

        <button
          type="submit"
          className="h-12 w-full rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-[0_14px_35px_rgba(214,40,40,0.22)] transition hover:bg-primary-hover sm:w-auto"
        >
          {submitLabel}
        </button>

        {showClearAction ? (
          <Link
            href={clearHref}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated sm:w-auto"
          >
            {clearLabel}
          </Link>
        ) : null}
      </div>
    </form>
  );
}