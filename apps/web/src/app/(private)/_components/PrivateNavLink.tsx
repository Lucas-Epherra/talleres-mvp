"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type PrivateNavLinkProps = {
  href: string;
  children: ReactNode;
};

/**
 * Sidebar navigation link with active route detection.
 *
 * This is intentionally a leaf Client Component because active route detection
 * depends on usePathname(). The private layout can remain server-rendered.
 */
export function PrivateNavLink({ href, children }: PrivateNavLinkProps) {
  const pathname = usePathname();
  const isActive = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={buildClassName(
        "block rounded-xl px-4 py-3 text-sm font-semibold transition",
        isActive
          ? "bg-orange-500 text-white"
          : "text-slate-200 hover:bg-slate-800 hover:text-white",
      )}
    >
      {children}
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