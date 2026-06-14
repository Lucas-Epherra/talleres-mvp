"use client";

import { useState } from "react";
import { PrivateNavLink } from "./PrivateNavLink";

const PRIVATE_NAVIGATION_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    code: "DB",
  },
  {
    href: "/customers",
    label: "Clientes",
    code: "CL",
  },
  {
    href: "/vehicles",
    label: "Vehículos",
    code: "VH",
  },
  {
    href: "/work-orders",
    label: "Órdenes",
    code: "OT",
  },
] as const;

/**
 * Responsive private navigation.
 *
 * Mobile uses an explicit toggle button instead of horizontal scrolling because
 * the menu must be discoverable for non-technical workshop users.
 */
export function PrivateNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <nav aria-label="Navegación principal">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="private-mobile-navigation"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="flex h-12 w-full items-center justify-between rounded-2xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-white transition hover:border-primary/70 hover:bg-surface-elevated lg:hidden"
      >
        <span className="font-display uppercase tracking-[0.08em]">
          Menú del taller
        </span>

        <span aria-hidden="true" className="text-primary">
          {isOpen ? "↑" : "↓"}
        </span>
      </button>

      <ul
        id="private-mobile-navigation"
        className={buildClassName(
          "mt-3 space-y-1 lg:hidden",
          isOpen ? "block" : "hidden",
        )}
      >
        {PRIVATE_NAVIGATION_ITEMS.map((item) => (
          <li key={item.href}>
            <PrivateNavLink
              href={item.href}
              code={item.code}
              onClick={closeMenu}
            >
              {item.label}
            </PrivateNavLink>
          </li>
        ))}
      </ul>

      <div className="hidden lg:block">
        <p className="mb-3 px-3 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          Operación
        </p>

        <ul className="space-y-1">
          {PRIVATE_NAVIGATION_ITEMS.map((item) => (
            <li key={item.href}>
              <PrivateNavLink href={item.href} code={item.code}>
                {item.label}
              </PrivateNavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

/**
 * Small className join helper to avoid adding a dependency for this use case.
 */
function buildClassName(...classes: string[]): string {
  return classes.join(" ");
}