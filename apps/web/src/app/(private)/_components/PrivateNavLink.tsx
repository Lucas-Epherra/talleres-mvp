"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEventHandler, ReactNode } from "react";

type PrivateNavLinkProps = {
  href: string;
  children: ReactNode;
  code: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

/**
 * Private navigation link with active route detection.
 *
 * This is intentionally a leaf Client Component because active route detection
 * depends on usePathname(). The private layout can remain server-rendered.
 */
export function PrivateNavLink({
  href,
  children,
  code,
  onClick,
}: PrivateNavLinkProps) {
  const pathname = usePathname();
  const isActive = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={buildClassName(
        "group relative flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-black transition",
        isActive
          ? "bg-primary text-white shadow-[0_14px_35px_rgba(214,40,40,0.22)]"
          : "text-[#374151] hover:bg-white/70 hover:text-[#111827]",
      )}
    >
      <span
        className={buildClassName(
          "grid size-8 shrink-0 place-items-center rounded-xl border text-[0.65rem] font-black uppercase tracking-[0.08em] transition",
          isActive
            ? "border-white/20 bg-white/12 text-white"
            : "border-[#c7ccd3] bg-[#edf0f3] text-[#4b5563] group-hover:border-primary/40 group-hover:bg-primary/10 group-hover:text-primary",
        )}
        aria-hidden="true"
      >
        {code}
      </span>

      <span className="truncate">{children}</span>

      {isActive ? (
        <span
          aria-hidden="true"
          className="absolute right-3 h-5 w-1 rounded-full bg-white/75"
        />
      ) : null}
    </Link>
  );
}

/**
 * Checks whether the current pathname belongs to a navigation section.
 *
 * This keeps nested routes active, for example:
 * /vehicles/new        -> /vehicles
 * /vehicles/[id]       -> /vehicles
 * /work-orders/new     -> /work-orders
 */
function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Small className join helper to avoid adding a dependency for this use case.
 */
function buildClassName(...classes: string[]): string {
  return classes.join(" ");
}