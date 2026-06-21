import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type PaginationProps = {
  basePath: string;
  currentPage: number;
  totalPages: number;
  searchParams?: Record<string, string | number | undefined>;
  ariaLabel: string;
};

const MAX_VISIBLE_PAGES = 5;

/**
 * Server-rendered pagination component.
 *
 * It uses regular links instead of client state so list pages remain compatible
 * with Server Components and URL-addressable filters.
 */
export function Pagination({
  basePath,
  currentPage,
  totalPages,
  searchParams = {},
  ariaLabel,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const visiblePages = getVisiblePages(currentPage, totalPages);
  const previousPage = Math.max(currentPage - 1, 1);
  const nextPage = Math.min(currentPage + 1, totalPages);

  return (
    <nav
      aria-label={ariaLabel}
      className="flex flex-col gap-3 rounded-[1.1rem] border border-border bg-surface/80 p-3 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:flex-row sm:items-center sm:justify-between sm:rounded-[1.35rem] sm:p-4"
    >
      <p className="text-sm font-semibold text-muted-foreground">
        Página <span className="font-black text-foreground">{currentPage}</span>{" "}
        de <span className="font-black text-foreground">{totalPages}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {currentPage > 1 ? (
          <PaginationLink
            href={buildPageHref(basePath, searchParams, previousPage)}
            label="Anterior"
            direction="previous"
          />
        ) : (
          <PaginationDisabledItem label="Anterior" direction="previous" />
        )}

        {visiblePages.map((page) => {
          const isCurrent = page === currentPage;

          return isCurrent ? (
            <span
              key={page}
              aria-current="page"
              className="grid size-10 place-items-center rounded-xl bg-primary text-sm font-black text-white"
            >
              {page}
            </span>
          ) : (
            <Link
              key={page}
              href={buildPageHref(basePath, searchParams, page)}
              className="grid size-10 place-items-center rounded-xl border border-border-strong bg-surface-muted text-sm font-black text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
            >
              {page}
            </Link>
          );
        })}

        {currentPage < totalPages ? (
          <PaginationLink
            href={buildPageHref(basePath, searchParams, nextPage)}
            label="Siguiente"
            direction="next"
          />
        ) : (
          <PaginationDisabledItem label="Siguiente" direction="next" />
        )}
      </div>
    </nav>
  );
}

/**
 * Renders an enabled pagination text link.
 */
function PaginationLink({
  href,
  label,
  direction,
}: {
  href: string;
  label: string;
  direction: "previous" | "next";
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
    >
      {direction === "previous" ? (
        <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
      ) : null}

      {label}

      {direction === "next" ? (
        <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
      ) : null}
    </Link>
  );
}

/**
 * Renders a disabled pagination item without fake button behavior.
 */
function PaginationDisabledItem({
  label,
  direction,
}: {
  label: string;
  direction: "previous" | "next";
}) {
  return (
    <span
      aria-disabled="true"
      className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-border bg-background/40 px-4 text-sm font-bold text-muted-foreground opacity-60"
    >
      {direction === "previous" ? (
        <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
      ) : null}

      {label}

      {direction === "next" ? (
        <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
      ) : null}
    </span>
  );
}

/**
 * Returns a small window of page numbers around the current page.
 */
function getVisiblePages(currentPage: number, totalPages: number): number[] {
  const halfWindow = Math.floor(MAX_VISIBLE_PAGES / 2);
  const startPage = Math.max(
    Math.min(currentPage - halfWindow, totalPages - MAX_VISIBLE_PAGES + 1),
    1,
  );
  const endPage = Math.min(startPage + MAX_VISIBLE_PAGES - 1, totalPages);

  return Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index,
  );
}

/**
 * Builds a page URL while preserving active list filters.
 */
function buildPageHref(
  basePath: string,
  searchParams: Record<string, string | number | undefined>,
  page: number,
): string {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && String(value).trim().length > 0) {
      params.set(key, String(value));
    }
  });

  if (page > 1) {
    params.set("page", String(page));
  } else {
    params.delete("page");
  }

  const queryString = params.toString();

  return queryString ? `${basePath}?${queryString}` : basePath;
}
