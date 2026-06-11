"use client";

import { useState } from "react";
import { PrivateNavLink } from "./PrivateNavLink";

const PRIVATE_NAVIGATION_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
  },
  {
    href: "/customers",
    label: "Clientes",
  },
  {
    href: "/vehicles",
    label: "Vehículos",
  },
  {
    href: "/work-orders",
    label: "Órdenes",
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
        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800 lg:hidden"
      >
        <span>Menú del taller</span>
        <span aria-hidden="true" className="text-slate-400">
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
            <PrivateNavLink href={item.href} onClick={closeMenu}>
              {item.label}
            </PrivateNavLink>
          </li>
        ))}
      </ul>

      <ul className="hidden space-y-1 lg:block">
        {PRIVATE_NAVIGATION_ITEMS.map((item) => (
          <li key={item.href}>
            <PrivateNavLink href={item.href}>{item.label}</PrivateNavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Small className join helper to avoid adding a dependency for this use case.
 */
function buildClassName(...classes: string[]): string {
  return classes.join(" ");
}