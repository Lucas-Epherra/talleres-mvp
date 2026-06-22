"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEventHandler, ReactNode } from "react";

type PrivateNavLinkProps = {
  href: string;
  children: ReactNode;
  icon: LucideIcon;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

/**
 * Private navigation link with active route detection.
 *
 * The selected state intentionally mirrors the approved render:
 * red background, white icon, white label, and no trailing active marker.
 */
export function PrivateNavLink({
  href,
  children,
  icon: Icon,
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
        "flex h-12 w-full items-center gap-3 rounded-2xl border px-5 text-base font-bold transition lg:w-auto lg:min-w-40",
        isActive
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface-muted text-foreground hover:border-border-strong hover:bg-surface-elevated",
      )}
    >
      <Icon
        className={buildClassName(
          "size-5 shrink-0 transition",
          isActive ? "text-primary-foreground" : "text-muted-foreground",
        )}
        aria-hidden="true"
      />

      <span
        className={buildClassName(
          "truncate",
          isActive ? "text-primary-foreground" : "text-foreground",
        )}
      >
        {children}
      </span>
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
 * Small helper to compose className strings without adding a dependency.
 */
function buildClassName(...classes: string[]): string {
  return classes.filter(Boolean).join(" ");
}
