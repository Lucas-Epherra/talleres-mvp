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
      className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
      role="search"
    >
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
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
          className="h-12 min-h-12 w-full min-w-0 flex-1 appearance-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-5 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
        />

        <button
          type="submit"
          className="h-12 w-full rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-400 sm:w-auto"
        >
          {submitLabel}
        </button>

        {showClearAction ? (
          <Link
            href={clearHref}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900 sm:w-auto"
          >
            {clearLabel}
          </Link>
        ) : null}
      </div>
    </form>
  );
}